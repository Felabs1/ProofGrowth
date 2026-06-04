import {
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  ScInt,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import {
  ESCROW_CONTRACT_ID,
  NATIVE_XLM_TOKEN_CONTRACT,
  NETWORK_PASSPHRASE,
  STELLAR_RPC_URL,
  toStroops,
} from '../config/stellar';
import { debugError, debugLog } from '../utils/debug';
import type { PayoutLine } from '../utils/payouts';

const SCOPE = 'escrow';

/** v14: SendTransactionStatus is a string union, not an enum object on Api */
const SEND_TX_STATUS = {
  ERROR: 'ERROR',
  PENDING: 'PENDING',
  DUPLICATE: 'DUPLICATE',
  TRY_AGAIN_LATER: 'TRY_AGAIN_LATER',
} as const;

const GET_TX_STATUS = {
  SUCCESS: 'SUCCESS',
  NOT_FOUND: 'NOT_FOUND',
  FAILED: 'FAILED',
} as const;

const server = new rpc.Server(STELLAR_RPC_URL);

function assertStellarSdk(): void {
  if (typeof Contract !== 'function') {
    const msg =
      'Stellar SDK Contract export is missing. Use named imports from @stellar/stellar-sdk (default import is undefined in Vite).';
    debugError(SCOPE, 'assertStellarSdk', new Error(msg), {
      ContractType: typeof Contract,
      TransactionBuilderType: typeof TransactionBuilder,
    });
    throw new Error(msg);
  }
}

export type SignTxFn = (xdr: string) => Promise<{ signedTxXdr: string }>;

async function pollTransaction(hash: string, maxAttempts = 60): Promise<rpc.Api.GetTransactionResponse> {
  debugLog(SCOPE, 'pollTransaction:start', { hash, maxAttempts });
  for (let i = 0; i < maxAttempts; i++) {
    const tx = await server.getTransaction(hash);
    if (tx.status !== GET_TX_STATUS.NOT_FOUND) {
      debugLog(SCOPE, 'pollTransaction:done', { hash, status: tx.status, attempt: i + 1 });
      return tx;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Transaction not found on ledger (timed out)');
}

function payoutToScVal(wallet: string, stroops: bigint): xdr.ScVal {
  return xdr.ScVal.scvMap(
    new Map([
      [xdr.ScVal.scvSymbol('winner'), new Address(wallet).toScVal()],
      [xdr.ScVal.scvSymbol('amount'), new ScInt(stroops).toScVal()],
    ]),
  );
}

async function submitContractTx(
  founderAddress: string,
  signTransaction: SignTxFn,
  operationName: string,
  build: (contract: Contract) => xdr.Operation,
): Promise<{ hash: string; result: rpc.Api.GetTransactionResponse }> {
  assertStellarSdk();
  debugLog(SCOPE, 'submitContractTx:start', {
    operationName,
    founderAddress,
    escrowContractId: ESCROW_CONTRACT_ID,
    rpcUrl: STELLAR_RPC_URL,
  });

  try {
    const contract = new Contract(ESCROW_CONTRACT_ID);
    debugLog(SCOPE, 'submitContractTx:contract', { operationName });

    const account = await server.getAccount(founderAddress);
    debugLog(SCOPE, 'submitContractTx:account', {
      operationName,
      sequence: account.sequenceNumber(),
    });

    let tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(build(contract))
      .setTimeout(180)
      .build();

    debugLog(SCOPE, 'submitContractTx:prepare', { operationName });
    tx = await server.prepareTransaction(tx);

    debugLog(SCOPE, 'submitContractTx:sign', { operationName });
    const { signedTxXdr } = await signTransaction(tx.toXDR());
    const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

    debugLog(SCOPE, 'submitContractTx:send', { operationName });
    const sent = await server.sendTransaction(signed);

    debugLog(SCOPE, 'submitContractTx:sent', {
      operationName,
      status: sent.status,
      hash: sent.hash,
    });

    if (sent.status === SEND_TX_STATUS.ERROR) {
      const errMsg =
        typeof sent.errorResult === 'string'
          ? sent.errorResult
          : sent.errorResult?.toString() ?? 'Transaction submission failed';
      debugError(SCOPE, 'submitContractTx:sendFailed', new Error(errMsg), {
        operationName,
        status: sent.status,
        errorResult: sent.errorResult,
        diagnosticEvents: 'diagnosticEvents' in sent ? sent.diagnosticEvents : undefined,
      });
      throw new Error(errMsg);
    }

    if (
      sent.status === SEND_TX_STATUS.TRY_AGAIN_LATER ||
      sent.status === SEND_TX_STATUS.DUPLICATE
    ) {
      const errMsg = `RPC returned status ${sent.status}; retry the transaction`;
      debugError(SCOPE, 'submitContractTx:sendRetry', new Error(errMsg), {
        operationName,
        status: sent.status,
      });
      throw new Error(errMsg);
    }

    debugLog(SCOPE, 'submitContractTx:poll', { operationName, hash: sent.hash });
    const result = await pollTransaction(sent.hash);
    if (result.status !== GET_TX_STATUS.SUCCESS) {
      const errMsg = `Transaction failed: ${result.status}`;
      debugError(SCOPE, 'submitContractTx:ledgerFailed', new Error(errMsg), {
        operationName,
        hash: sent.hash,
        status: result.status,
      });
      throw new Error(errMsg);
    }

    debugLog(SCOPE, 'submitContractTx:success', { operationName, hash: sent.hash });
    return { hash: sent.hash, result };
  } catch (e) {
    debugError(SCOPE, `submitContractTx:${operationName}`, e, { founderAddress });
    throw e;
  }
}

export async function createCompetitionOnChain(opts: {
  founderAddress: string;
  title: string;
  amountXlm: number;
  winnersCount: number;
  tokenContractId?: string;
  signTransaction: SignTxFn;
}): Promise<{ onChainId: number; txHash: string }> {
  const tokenId = opts.tokenContractId ?? NATIVE_XLM_TOKEN_CONTRACT;
  const stroops = toStroops(opts.amountXlm);

  debugLog(SCOPE, 'createCompetitionOnChain', {
    founderAddress: opts.founderAddress,
    title: opts.title,
    amountXlm: opts.amountXlm,
    stroops: stroops.toString(),
    winnersCount: opts.winnersCount,
    tokenId,
  });

  const { hash, result } = await submitContractTx(
    opts.founderAddress,
    opts.signTransaction,
    'create_competition',
    (contract) =>
      contract.call(
        'create_competition',
        nativeToScVal(new Address(opts.founderAddress), { type: 'address' }),
        nativeToScVal(new Address(tokenId), { type: 'address' }),
        nativeToScVal(stroops, { type: 'i128' }),
        nativeToScVal(opts.winnersCount, { type: 'u32' }),
        nativeToScVal(opts.title.slice(0, 64), { type: 'string' }),
      ),
  );

  if (!result.returnValue) {
    const err = new Error('Could not read on-chain competition id from transaction result');
    debugError(SCOPE, 'createCompetitionOnChain:noReturnValue', err, { hash });
    throw err;
  }
  const raw = scValToNative(result.returnValue);
  const onChainId = typeof raw === 'bigint' ? Number(raw) : Number(raw);
  debugLog(SCOPE, 'createCompetitionOnChain:done', { onChainId, hash });
  return { onChainId, txHash: hash };
}

export async function finalizeAndDistributeOnChain(opts: {
  founderAddress: string;
  onChainId: number;
  payouts: PayoutLine[];
  signTransaction: SignTxFn;
}): Promise<{ txHash: string }> {
  if (opts.payouts.length === 0) {
    throw new Error('At least one payout is required');
  }

  debugLog(SCOPE, 'finalizeAndDistributeOnChain', {
    founderAddress: opts.founderAddress,
    onChainId: opts.onChainId,
    payoutCount: opts.payouts.length,
    payouts: opts.payouts,
  });

  const payoutsVec = xdr.ScVal.scvVec(
    opts.payouts.map((p) => payoutToScVal(p.wallet, toStroops(p.amount_xlm))),
  );

  const { hash } = await submitContractTx(
    opts.founderAddress,
    opts.signTransaction,
    'finalize_and_distribute',
    (contract) =>
      contract.call(
        'finalize_and_distribute',
        xdr.ScVal.scvU64(BigInt(opts.onChainId)),
        payoutsVec,
      ),
  );

  debugLog(SCOPE, 'finalizeAndDistributeOnChain:done', { hash });
  return { txHash: hash };
}
