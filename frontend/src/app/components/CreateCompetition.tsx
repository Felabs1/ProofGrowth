import { useMemo, useState } from "react";
import { createCompetitionOnPlatform } from "../api/client";
import { createCompetitionOnChain } from "../contracts/escrow";
import { debugError, debugLog } from "../utils/debug";
import {
  ESCROW_CONTRACT_ID,
  explorerContractUrl,
  explorerTxUrl,
  NATIVE_XLM_TOKEN_CONTRACT,
  PRIZE_ASSET,
} from "../config/stellar";
import { useWallet } from "../wallet/WalletContext";
import { StellarWalletsKit } from "../wallet/walletKit";

interface CreateCompetitionProps {
  onNavigate: (page: string, id?: string) => void;
}

type CompType = "users" | "volume" | "leads";
type WinnersMode = "1" | "3" | "5" | "custom";

const TYPES: {
  id: CompType;
  title: string;
  blurb: string;
  icon: string;
  actionLabel: string;
  defaultPoints: number;
}[] = [
  {
    id: "users",
    title: "User acquisition",
    blurb: "Signups, activations, retention — participants submit proof; you verify in your product analytics.",
    icon: "◎",
    actionLabel: "Per approved user/action",
    defaultPoints: 10,
  },
  {
    id: "volume",
    title: "Volume & revenue",
    blurb: "Transactions, GMV, or usage volume — reviewed against Stripe, dashboards, or internal reports.",
    icon: "⇄",
    actionLabel: "Per approved volume milestone",
    defaultPoints: 25,
  },
  {
    id: "leads",
    title: "Leads & B2B",
    blurb: "Demos, calls, trials — participants submit CRM links; you confirm in HubSpot or Salesforce.",
    icon: "✦",
    actionLabel: "Per approved lead milestone",
    defaultPoints: 20,
  },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--pg-text-sec)",
  marginBottom: 8,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 400,
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--pg-text-dim)",
  marginTop: 6,
  lineHeight: 1.5,
};

const emptyForm = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  type: "users" as CompType,
  instructions: "",
  proofRequirements: "",
  basePoints: 10,
  firstBonus: true,
  firstBonusPoints: 5,
  repeatBonus: false,
  repeatBonusPoints: 2,
  winnersMode: "3" as WinnersMode,
  customSplit: [50, 30, 20] as number[],
  prizePool: "",
  escrowConfirmed: false,
};

type LaunchResult = {
  platformId: string;
  onChainId: number;
  txHash: string;
};

export function CreateCompetition({ onNavigate }: CreateCompetitionProps) {
  const { address, isConnected, connect, signTransaction } = useWallet();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);

  const update = <K extends keyof typeof emptyForm>(
    key: K,
    val: (typeof emptyForm)[K],
  ) => setForm((f) => ({ ...f, [key]: val }));

  const selectType = (t: CompType) => {
    const meta = TYPES.find((x) => x.id === t)!;
    setForm((f) => ({ ...f, type: t, basePoints: meta.defaultPoints }));
  };

  const activeType = TYPES.find((t) => t.id === form.type)!;
  const splitTotal = form.customSplit.reduce((a, b) => a + (b || 0), 0);

  const step1Valid = form.name.trim() && form.startDate && form.endDate;
  const step2Valid = form.instructions.trim().length > 20;
  const winnersValid = form.winnersMode !== "custom" || splitTotal === 100;
  const step3Valid =
    Number(form.prizePool) > 0 && form.escrowConfirmed && winnersValid;

  const config = useMemo(
    () => ({
      name: form.name,
      description: form.description,
      schedule: { start: form.startDate, end: form.endDate },
      type: form.type,
      judging: {
        mode: "founder_review",
        instructions: form.instructions,
        proofRequirements: form.proofRequirements
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      scoring: {
        base: { action: activeType.actionLabel, points: form.basePoints },
        bonuses: [
          ...(form.firstBonus
            ? [{ kind: "first_milestone", points: form.firstBonusPoints }]
            : []),
          ...(form.repeatBonus
            ? [{ kind: "repeat_milestone", points: form.repeatBonusPoints }]
            : []),
        ],
      },
      winners:
        form.winnersMode === "custom"
          ? { split: form.customSplit }
          : { top: Number(form.winnersMode) },
      prize: {
        asset: PRIZE_ASSET,
        amount: Number(form.prizePool),
        escrow: "soroban",
      },
      tracking: { mode: "founder_review", escrow: "soroban" },
    }),
    [form, activeType],
  );

  const winnersCount =
    form.winnersMode === "custom"
      ? form.customSplit.length
      : Number(form.winnersMode);

  const handleLaunch = async () => {
    setLaunchError(null);
    let founderAddress = address;
    if (!founderAddress) {
      try {
        await connect();
        founderAddress = (await StellarWalletsKit.getAddress()).address;
      } catch {
        setLaunchError("Connect your Stellar wallet to lock escrow and launch.");
        return;
      }
    }
    if (!founderAddress) {
      setLaunchError("Wallet address unavailable. Try connecting again.");
      return;
    }

    setLaunching(true);
    debugLog("create-competition", "launch:start", {
      founderAddress,
      prizePool: form.prizePool,
      winnersCount,
    });
    try {
      const { onChainId, txHash } = await createCompetitionOnChain({
        founderAddress,
        title: form.name.trim(),
        amountXlm: Number(form.prizePool),
        winnersCount,
        signTransaction,
      });

      const { competition } = await createCompetitionOnPlatform({
        founder_wallet: founderAddress,
        title: form.name.trim(),
        description: form.description,
        goal_type: form.type,
        instructions: form.instructions,
        proof_requirements: config.judging.proofRequirements as string[],
        scoring_rules: [
          {
            label: (config.scoring as { base: { action: string } }).base.action,
            points: form.basePoints,
          },
          ...(
            (config.scoring as { bonuses: { kind: string; points: number }[] })
              .bonuses ?? []
          ).map((b) => ({
            label: b.kind.replace(/_/g, " "),
            points: b.points,
          })),
        ],
        prize_pool: Number(form.prizePool),
        winners_count: winnersCount,
        winner_split: config.winners as { top: number } | { split: number[] },
        start_at: form.startDate,
        end_at: form.endDate,
        on_chain_id: onChainId,
        token_contract: NATIVE_XLM_TOKEN_CONTRACT,
        create_tx_hash: txHash,
      });

      setLaunchResult({
        platformId: competition.id,
        onChainId,
        txHash,
      });
      debugLog("create-competition", "launch:success", {
        platformId: competition.id,
        onChainId,
        txHash,
      });
      setSubmitted(true);
    } catch (e) {
      debugError("create-competition", "launch:failed", e, {
        founderAddress,
        prizePool: form.prizePool,
      });
      const msg = e instanceof Error ? e.message : "Launch failed";
      setLaunchError(msg);
    } finally {
      setLaunching(false);
    }
  };

  if (submitted && launchResult) {
    return (
      <LaunchSuccess
        form={form}
        config={config}
        launchResult={launchResult}
        onNavigate={onNavigate}
        onReset={() => {
          setSubmitted(false);
          setLaunchResult(null);
          setLaunchError(null);
          setStep(1);
          setForm(emptyForm);
        }}
      />
    );
  }

  const steps = ["Basics", "Judging & scoring", "Prizes & launch"];

  return (
    <div
      className="pg-page"
      style={{ maxWidth: 720, margin: "0 auto", padding: "100px 2rem 60px" }}
    >
      <button
        onClick={() => onNavigate("browse")}
        style={{
          background: "none",
          border: "none",
          color: "var(--pg-text-sec)",
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back
      </button>

      <h1
        style={{
          fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        Launch a growth competition
      </h1>
      <p
        style={{
          color: "var(--pg-text-sec)",
          fontSize: 15,
          marginBottom: "1.25rem",
          lineHeight: 1.6,
        }}
      >
        Define how participants prove growth work and how you will score submissions.
        Prize pool stays in escrow; payouts run on-chain when you finalize winners.
      </p>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "var(--pg-accent-glow)",
          border: "1px solid var(--pg-border)",
          borderRadius: 999,
          padding: "6px 14px",
          marginBottom: "2.5rem",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--pg-green)",
            boxShadow: "0 0 8px var(--pg-green)",
          }}
          className="pg-pulse-dot"
        />
        <span
          style={{
            fontSize: 12,
            color: "var(--pg-text-sec)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Founder-verified submissions · Soroban escrow · No app integration required
        </span>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: "2.5rem" }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    step > i + 1
                      ? "var(--pg-green)"
                      : step === i + 1
                        ? "var(--pg-accent)"
                        : "var(--pg-surface)",
                  color: step >= i + 1 ? "white" : "var(--pg-text-dim)",
                  border:
                    step === i + 1
                      ? "2px solid var(--pg-accent-bright)"
                      : "2px solid transparent",
                  transition: "all 0.3s",
                }}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background:
                      step > i + 1 ? "var(--pg-green)" : "var(--pg-border-dim)",
                    transition: "background 0.3s",
                    margin: "0 4px",
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                color: step === i + 1 ? "var(--pg-text)" : "var(--pg-text-dim)",
                fontWeight: step === i + 1 ? 600 : 400,
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label style={labelStyle}>Competition name *</label>
            <input
              className="pg-input"
              placeholder="e.g. Summer XLM Growth Sprint"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>What are you rewarding?</label>
            <textarea
              className="pg-textarea"
              placeholder="One line on the behavior you want to drive — e.g. “Acquire the most active SaaS users.”"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Starts *</label>
              <input
                className="pg-input"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Ends *</label>
              <input
                className="pg-input"
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "0.5rem",
            }}
          >
            <button
              className="pg-btn-primary"
              style={{
                padding: "12px 28px",
                fontSize: 14,
                opacity: step1Valid ? 1 : 0.5,
              }}
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Judging & scoring */}
      {step === 2 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
        >
          <div>
            <label style={labelStyle}>Growth goal</label>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {TYPES.map((t) => {
                const active = form.type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectType(t.id)}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: active
                        ? "var(--pg-accent-glow)"
                        : "var(--pg-mid)",
                      border: `1px solid ${active ? "var(--pg-accent-bright)" : "var(--pg-border-dim)"}`,
                      transition: "all 0.18s",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        background: active
                          ? "var(--pg-accent)"
                          : "var(--pg-surface)",
                        color: active ? "#fff" : "var(--pg-accent-bright)",
                      }}
                    >
                      {t.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--pg-text)",
                        }}
                      >
                        {t.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--pg-text-sec)",
                          lineHeight: 1.4,
                        }}
                      >
                        {t.blurb}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        flexShrink: 0,
                        border: `2px solid ${active ? "var(--pg-accent-bright)" : "var(--pg-text-dim)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {active && (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "var(--pg-accent-bright)",
                          }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Instructions for participants *</label>
            <textarea
              className="pg-textarea"
              placeholder="What counts? How will you verify? e.g. Only users who complete onboarding in our app; must use assigned UTM; check against Mixpanel cohort X."
              value={form.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              style={{ minHeight: 100 }}
            />
            <p style={hintStyle}>
              Participants submit proof against these rules. You review using your analytics, CRM, or dashboards.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Required proof (one per line)</label>
            <textarea
              className="pg-textarea"
              placeholder={"UTM or referral link\nScreenshot or analytics export\nUser IDs or emails (anonymized OK)"}
              value={form.proofRequirements}
              onChange={(e) => update("proofRequirements", e.target.value)}
              style={{ minHeight: 88 }}
            />
          </div>

          <div>
            <label style={labelStyle}>Scoring rubric (on approval)</label>
            <div
              style={{
                background: "var(--pg-mid)",
                border: "1px solid var(--pg-border)",
                borderRadius: 12,
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <PointRow
                label={activeType.actionLabel}
                sub="Base points per action"
                value={form.basePoints}
                onChange={(v) => update("basePoints", v)}
              />
              <div style={{ height: 1, background: "var(--pg-border-dim)" }} />
              <ToggleRow
                label="First-milestone bonus"
                sub="Extra points for first approved batch per participant"
                enabled={form.firstBonus}
                onToggle={() => update("firstBonus", !form.firstBonus)}
                value={form.firstBonusPoints}
                onChange={(v) => update("firstBonusPoints", v)}
              />
              <ToggleRow
                label="Repeat milestone bonus"
                sub="Extra points when a participant hits repeat targets"
                enabled={form.repeatBonus}
                onToggle={() => update("repeatBonus", !form.repeatBonus)}
                value={form.repeatBonusPoints}
                onChange={(v) => update("repeatBonusPoints", v)}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              className="pg-btn-secondary"
              style={{ padding: "12px 28px", fontSize: 14 }}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              className="pg-btn-primary"
              style={{
                padding: "12px 28px",
                fontSize: 14,
                opacity: step2Valid ? 1 : 0.5,
              }}
              disabled={!step2Valid}
              onClick={() => setStep(3)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Prizes & launch */}
      {step === 3 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
        >
          <div>
            <label style={labelStyle}>Who wins?</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["1", "3", "5", "custom"] as WinnersMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => update("winnersMode", m)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    background:
                      form.winnersMode === m
                        ? "var(--pg-accent)"
                        : "var(--pg-surface)",
                    color:
                      form.winnersMode === m ? "#fff" : "var(--pg-text-sec)",
                    border: `1px solid ${form.winnersMode === m ? "var(--pg-accent-bright)" : "var(--pg-border-dim)"}`,
                  }}
                >
                  {m === "custom" ? "Custom split" : `Top ${m}`}
                </button>
              ))}
            </div>
            {form.winnersMode === "custom" && (
              <div
                style={{
                  marginTop: "1rem",
                  background: "var(--pg-mid)",
                  border: "1px solid var(--pg-border-dim)",
                  borderRadius: 12,
                  padding: "1rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {form.customSplit.map((pct, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--pg-text-sec)",
                        width: 80,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {ordinal(i + 1)} place
                    </span>
                    <input
                      className="pg-input"
                      type="number"
                      min="0"
                      max="100"
                      value={pct}
                      onChange={(e) => {
                        const next = [...form.customSplit];
                        next[i] = Number(e.target.value);
                        update("customSplit", next);
                      }}
                      style={{ width: 90 }}
                    />
                    <span style={{ fontSize: 13, color: "var(--pg-text-dim)" }}>
                      %
                    </span>
                    {form.customSplit.length > 1 && (
                      <button
                        onClick={() =>
                          update(
                            "customSplit",
                            form.customSplit.filter((_, idx) => idx !== i),
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--pg-text-dim)",
                          cursor: "pointer",
                          fontSize: 16,
                          marginLeft: "auto",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <button
                    className="pg-btn-secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    onClick={() =>
                      update("customSplit", [...form.customSplit, 0])
                    }
                  >
                    + Add place
                  </button>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      color:
                        splitTotal === 100
                          ? "var(--pg-green)"
                          : "var(--pg-amber)",
                    }}
                  >
                    {splitTotal}% allocated{" "}
                    {splitTotal === 100 ? "✓" : "(must equal 100%)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Prize pool *</label>
            <div style={{ position: "relative" }}>
              <input
                className="pg-input"
                type="number"
                min="1"
                placeholder="500"
                value={form.prizePool}
                onChange={(e) => update("prizePool", e.target.value)}
                style={{ paddingRight: 64 }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 14,
                  color: "var(--pg-text-dim)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {PRIZE_ASSET}
              </span>
            </div>
          </div>

          {/* Escrow confirm */}
          <button
            onClick={() => update("escrowConfirmed", !form.escrowConfirmed)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              background: form.escrowConfirmed
                ? "var(--pg-accent-glow)"
                : "var(--pg-mid)",
              border: `1px solid ${form.escrowConfirmed ? "var(--pg-accent-bright)" : "var(--pg-border-dim)"}`,
              transition: "all 0.18s",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                flexShrink: 0,
                marginTop: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: form.escrowConfirmed
                  ? "var(--pg-accent)"
                  : "transparent",
                border: `2px solid ${form.escrowConfirmed ? "var(--pg-accent-bright)" : "var(--pg-text-dim)"}`,
                color: "#fff",
                fontSize: 13,
              }}
            >
              {form.escrowConfirmed ? "✓" : ""}
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--pg-text)",
                }}
              >
                Lock {form.prizePool || "0"} {PRIZE_ASSET} in escrow
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--pg-text-sec)",
                  lineHeight: 1.5,
                }}
              >
                Held safely on Stellar and paid out automatically to winners
                when the competition ends.
              </div>
            </div>
          </button>

          {/* Recap */}
          <div
            style={{
              background: "var(--pg-mid)",
              border: "1px solid var(--pg-border)",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            {[
              { label: "Name", value: form.name || "—" },
              { label: "Goal", value: activeType.title },
              {
                label: "Review",
                value: "Founder-verified submissions",
              },
              {
                label: "Base",
                value: `${activeType.actionLabel} = ${form.basePoints} pts`,
              },
              {
                label: "Winners",
                value:
                  form.winnersMode === "custom"
                    ? `Custom (${form.customSplit.length})`
                    : `Top ${form.winnersMode}`,
              },
              {
                label: "Prize",
                value: form.prizePool ? `${form.prizePool} ${PRIZE_ASSET}` : "—",
              },
            ].map((row, i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid var(--pg-border-dim)"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--pg-text-dim)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--pg-text)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    maxWidth: "60%",
                    textAlign: "right",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {!winnersValid && (
            <p style={{ ...hintStyle, color: "var(--pg-amber)" }}>
              Custom split must add up to 100%.
            </p>
          )}

          <p style={{ ...hintStyle, marginBottom: 16 }}>
            Escrow contract:{" "}
            <a
              href={explorerContractUrl(ESCROW_CONTRACT_ID)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--pg-accent-bright)" }}
            >
              {ESCROW_CONTRACT_ID.slice(0, 8)}…
            </a>
            {" · "}
            {isConnected ? `Wallet ${address?.slice(0, 4)}…` : "Wallet not connected"}
          </p>

          {launchError && (
            <p style={{ ...hintStyle, color: "var(--pg-red)", marginBottom: 12 }}>
              {launchError}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              className="pg-btn-secondary"
              style={{ padding: "12px 28px", fontSize: 14 }}
              onClick={() => setStep(2)}
            >
              ← Back
            </button>
            <button
              className="pg-btn-primary"
              style={{
                padding: "14px 36px",
                fontSize: 15,
                fontWeight: 700,
                opacity: step3Valid ? 1 : 0.5,
              }}
              disabled={!step3Valid || launching}
              onClick={() => void handleLaunch()}
            >
              {launching ? "Signing & launching…" : "Launch competition"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PointRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--pg-text)" }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--pg-text-dim)" }}>{sub}</div>
      </div>
      <input
        className="pg-input"
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 80 }}
      />
      <span style={{ fontSize: 13, color: "var(--pg-text-dim)", width: 24 }}>
        pts
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  enabled,
  onToggle,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  enabled: boolean;
  onToggle: () => void;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={onToggle}
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          flexShrink: 0,
          border: "none",
          cursor: "pointer",
          background: enabled ? "var(--pg-accent)" : "var(--pg-surface)",
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: enabled ? "var(--pg-text)" : "var(--pg-text-sec)",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--pg-text-dim)" }}>{sub}</div>
      </div>
      <input
        className="pg-input"
        type="number"
        min="0"
        value={value}
        disabled={!enabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 80, opacity: enabled ? 1 : 0.4 }}
      />
      <span style={{ fontSize: 13, color: "var(--pg-text-dim)", width: 24 }}>
        pts
      </span>
    </div>
  );
}

function LaunchSuccess({
  form,
  config,
  launchResult,
  onNavigate,
  onReset,
}: {
  form: typeof emptyForm;
  config: object;
  launchResult: LaunchResult;
  onNavigate: (page: string, id?: string) => void;
  onReset: () => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const provisioned = [
    { title: "Competition created", sub: "Instructions and rubric are published." },
    {
      title: "Submission inbox ready",
      sub: "Participants can join and submit proof for your review.",
    },
    {
      title: "Review queue open",
      sub: "Approve or reject submissions to update the leaderboard.",
    },
    {
      title: "Leaderboard live",
      sub: "Rankings reflect approved points only.",
    },
    {
      title: "Prize escrow locked",
      sub: `${form.prizePool || "0"} ${PRIZE_ASSET} secured on Soroban.`,
    },
  ];

  return (
    <div
      className="pg-page"
      style={{ maxWidth: 600, margin: "0 auto", padding: "120px 2rem 60px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(16,185,129,0.15)",
            border: "2px solid var(--pg-green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            margin: "0 auto 1.5rem",
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: "1.9rem", fontWeight: 700, marginBottom: 8 }}>
          You're live!
        </h2>
        <p style={{ color: "var(--pg-text-sec)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--pg-text)" }}>
            {form.name || "Your competition"}
          </strong>{" "}
          is open for submissions. Review proof from your Review queue.
        </p>
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--pg-deep)",
            borderRadius: 10,
            border: "1px solid var(--pg-border-dim)",
            textAlign: "left",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.7,
            color: "var(--pg-text-sec)",
          }}
        >
          <div>
            Platform id:{" "}
            <span style={{ color: "var(--pg-text)" }}>{launchResult.platformId}</span>
          </div>
          <div>
            On-chain id:{" "}
            <span style={{ color: "var(--pg-green)" }}>{launchResult.onChainId}</span>
          </div>
          <div>
            <a
              href={explorerTxUrl(launchResult.txHash)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--pg-accent-bright)" }}
            >
              View escrow transaction →
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--pg-mid)",
          border: "1px solid var(--pg-border)",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}
      >
        {provisioned.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderBottom:
                i < provisioned.length - 1
                  ? "1px solid var(--pg-border-dim)"
                  : "none",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                flexShrink: 0,
                background: "var(--pg-green)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              ✓
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--pg-text)",
                }}
              >
                {p.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--pg-text-sec)" }}>
                {p.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowConfig((s) => !s)}
        style={{
          background: "none",
          border: "none",
          color: "var(--pg-text-dim)",
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          marginBottom: showConfig ? "0.75rem" : "1.5rem",
        }}
      >
        {showConfig ? "− Hide" : "+ View"} configuration
      </button>
      {showConfig && (
        <pre
          style={{
            background: "var(--pg-deep)",
            border: "1px solid var(--pg-border-dim)",
            borderRadius: 10,
            padding: "1rem",
            overflowX: "auto",
            fontSize: 12,
            color: "var(--pg-text-mono)",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: "1.5rem",
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(config, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button
          className="pg-btn-primary"
          style={{ flex: 1, minWidth: 140, padding: "12px 24px", fontSize: 14 }}
          onClick={() => onNavigate("review", undefined, { tab: "pending" })}
        >
          Open review queue
        </button>
        <button
          className="pg-btn-secondary"
          style={{ flex: 1, minWidth: 140, padding: "12px 24px", fontSize: 14 }}
          onClick={() => onNavigate("browse")}
        >
          View competitions
        </button>
        <button
          className="pg-btn-secondary"
          style={{ flex: 1, padding: "12px 24px", fontSize: 14 }}
          onClick={onReset}
        >
          Create another
        </button>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function truncate(addr: string): string {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
