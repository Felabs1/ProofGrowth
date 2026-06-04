#![cfg(test)]

extern crate std;

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String, Vec,
};

fn setup_token(env: &Env, admin: &Address, holder: &Address, amount: i128) -> Address {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = sac.address();
    let mint_client = StellarAssetClient::new(env, &token);
    mint_client.mint(holder, &amount);
    token
}

#[test]
fn create_competition_escrows_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 1_000);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &1_000,
        &3,
        &String::from_str(&env, "Acquire active users"),
    );

    assert_eq!(id, 0);
    assert_eq!(client.escrow_balance(&id), 1_000);

    let comp = client.get_competition(&id);
    assert_eq!(comp.prize_pool, 1_000);
    assert_eq!(comp.status, CompetitionStatus::Active);
    assert_eq!(comp.founder, founder);
}

#[test]
fn finalize_and_distribute_pays_winners() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let w1 = Address::generate(&env);
    let w2 = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 1_000);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &1_000,
        &3,
        &String::from_str(&env, "SaaS Sprint"),
    );

    let payouts = Vec::from_array(
        &env,
        [
            Payout {
                winner: w1.clone(),
                amount: 600,
            },
            Payout {
                winner: w2.clone(),
                amount: 400,
            },
        ],
    );

    client.finalize_and_distribute(&id, &payouts);

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&w1), 600);
    assert_eq!(token_client.balance(&w2), 400);
    assert_eq!(client.escrow_balance(&id), 0);

    let comp = client.get_competition(&id);
    assert_eq!(comp.status, CompetitionStatus::Finalized);
}

#[test]
fn claim_after_finalize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let winner = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 500);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &500,
        &1,
        &String::from_str(&env, "Lead sprint"),
    );

    let payouts = Vec::from_array(
        &env,
        [Payout {
            winner: winner.clone(),
            amount: 500,
        }],
    );

    client.finalize_competition(&id, &payouts);
    let claimed = client.claim(&id, &winner);
    assert_eq!(claimed, 500);

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&winner), 500);

    let err = client.try_claim(&id, &winner);
    assert_eq!(err, Err(Ok(Error::AlreadyClaimed)));
}

#[test]
fn cancel_refunds_founder() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 750);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &750,
        &3,
        &String::from_str(&env, "Cancelled comp"),
    );

    client.cancel_competition(&id);

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&founder), 750);

    let comp = client.get_competition(&id);
    assert_eq!(comp.status, CompetitionStatus::Cancelled);
}

#[test]
fn payout_sum_must_match_pool() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let w1 = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 500);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &500,
        &2,
        &String::from_str(&env, "Test"),
    );

    let payouts = Vec::from_array(
        &env,
        [Payout {
            winner: w1,
            amount: 400,
        }],
    );

    let err = client.try_finalize_competition(&id, &payouts);
    assert_eq!(err, Err(Ok(Error::PayoutMismatch)));
}

#[test]
fn next_id_increments_across_competitions() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 3_000);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    assert_eq!(client.next_id(), 0);

    let id0 = client
        .try_create_competition(
            &founder,
            &token,
            &1_000,
            &3,
            &String::from_str(&env, "First"),
        )
        .unwrap()
        .unwrap();
    let id1 = client
        .try_create_competition(
            &founder,
            &token,
            &1_000,
            &3,
            &String::from_str(&env, "Second"),
        )
        .unwrap()
        .unwrap();
    let id2 = client
        .try_create_competition(
            &founder,
            &token,
            &1_000,
            &3,
            &String::from_str(&env, "Third"),
        )
        .unwrap()
        .unwrap();

    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.next_id(), 3);
}

#[test]
fn create_rejects_invalid_inputs() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 100);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);
    let title = String::from_str(&env, "Bad");

    assert_eq!(
        client.try_create_competition(&founder, &token, &0, &3, &title),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        client.try_create_competition(&founder, &token, &100, &0, &title),
        Err(Ok(Error::InvalidAmount))
    );
}

#[test]
fn get_competition_not_found() {
    let env = Env::default();
    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let result = client.try_get_competition(&99);
    assert!(matches!(result, Err(Ok(Error::NotFound))));
}

#[test]
fn finalize_validation_errors() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let w1 = Address::generate(&env);
    let w2 = Address::generate(&env);
    let w3 = Address::generate(&env);
    let w4 = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 1_000);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &1_000,
        &2,
        &String::from_str(&env, "Validation"),
    );

    let empty = Vec::new(&env);
    assert_eq!(
        client.try_finalize_competition(&id, &empty),
        Err(Ok(Error::EmptyPayouts))
    );

    let too_many = Vec::from_array(
        &env,
        [
            Payout {
                winner: w1.clone(),
                amount: 250,
            },
            Payout {
                winner: w2.clone(),
                amount: 250,
            },
            Payout {
                winner: w3,
                amount: 250,
            },
            Payout {
                winner: w4,
                amount: 250,
            },
        ],
    );
    assert_eq!(
        client.try_finalize_competition(&id, &too_many),
        Err(Ok(Error::TooManyWinners))
    );

    let zero_row = Vec::from_array(
        &env,
        [Payout {
            winner: w1.clone(),
            amount: 0,
        }],
    );
    assert_eq!(
        client.try_finalize_competition(&id, &zero_row),
        Err(Ok(Error::InvalidAmount))
    );

    let overpay = Vec::from_array(
        &env,
        [
            Payout {
                winner: w1,
                amount: 600,
            },
            Payout {
                winner: w2.clone(),
                amount: 500,
            },
        ],
    );
    assert_eq!(
        client.try_finalize_competition(&id, &overpay),
        Err(Ok(Error::PayoutMismatch))
    );
}

#[test]
fn cannot_cancel_or_finalize_after_end_state() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let winner = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 300);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &300,
        &1,
        &String::from_str(&env, "Ended"),
    );

    let payouts = Vec::from_array(
        &env,
        [Payout {
            winner: winner.clone(),
            amount: 300,
        }],
    );
    client.finalize_and_distribute(&id, &payouts);

    assert_eq!(
        client.try_cancel_competition(&id),
        Err(Ok(Error::NotActive))
    );
    assert_eq!(
        client.try_finalize_competition(&id, &payouts),
        Err(Ok(Error::NotActive))
    );
}

#[test]
fn claim_requires_finalize_and_matching_winner() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let winner = Address::generate(&env);
    let stranger = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 200);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &200,
        &1,
        &String::from_str(&env, "Claims"),
    );

    assert_eq!(
        client.try_claim(&id, &winner),
        Err(Ok(Error::NotFinalized))
    );

    let payouts = Vec::from_array(
        &env,
        [Payout {
            winner: winner.clone(),
            amount: 200,
        }],
    );
    client.finalize_competition(&id, &payouts);

    assert_eq!(
        client.try_claim(&id, &stranger),
        Err(Ok(Error::NothingToClaim))
    );
}

#[test]
fn two_winners_claim_independently() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let w1 = Address::generate(&env);
    let w2 = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 1_000);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &1_000,
        &2,
        &String::from_str(&env, "Split claim"),
    );

    let payouts = Vec::from_array(
        &env,
        [
            Payout {
                winner: w1.clone(),
                amount: 700,
            },
            Payout {
                winner: w2.clone(),
                amount: 300,
            },
        ],
    );
    client.finalize_competition(&id, &payouts);

    assert_eq!(client.claim(&id, &w1), 700);
    assert_eq!(client.claim(&id, &w2), 300);

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&w1), 700);
    assert_eq!(token_client.balance(&w2), 300);
    assert_eq!(client.escrow_balance(&id), 0);
}

#[test]
fn cancelled_competition_cannot_be_finalized() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let winner = Address::generate(&env);
    let token = setup_token(&env, &admin, &founder, 400);

    let contract_id = env.register(ZaoTrakEscrow, ());
    let client = ZaoTrakEscrowClient::new(&env, &contract_id);

    let id = client.create_competition(
        &founder,
        &token,
        &400,
        &1,
        &String::from_str(&env, "Cancel path"),
    );
    client.cancel_competition(&id);

    let payouts = Vec::from_array(
        &env,
        [Payout {
            winner,
            amount: 400,
        }],
    );
    assert_eq!(
        client.try_finalize_competition(&id, &payouts),
        Err(Ok(Error::NotActive))
    );
}
