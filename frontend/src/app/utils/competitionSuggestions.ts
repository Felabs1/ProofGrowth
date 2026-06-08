export type CompType = 'users' | 'volume' | 'leads';
export type SuggestField = 'description' | 'instructions' | 'proofRequirements';
/** @deprecated Use SuggestField */
export type JudgingField = SuggestField;

export interface SuggestionChip {
  id: string;
  label: string;
  /** Passed to the API as refinement intent; local-only chips use `local`. */
  intent: string;
  mode: 'local' | 'ai';
}

export interface JudgingContext {
  name: string;
  description: string;
  competitionType: CompType;
  instructions: string;
  proofRequirements: string;
}

const TYPE_LABEL: Record<CompType, string> = {
  users: 'user acquisition',
  volume: 'volume & revenue',
  leads: 'leads & B2B',
};

function appendBlock(current: string, block: string): string {
  const base = current.trim();
  if (!base) return block.trim();
  if (base.includes(block.trim())) return base;
  return `${base}\n\n${block.trim()}`;
}

function appendProofLine(current: string, line: string): string {
  const lines = current
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.some((l) => l.toLowerCase() === line.toLowerCase())) return current;
  return [...lines, line].join('\n');
}

const DESCRIPTION_BY_TYPE: Record<CompType, string> = {
  users: 'Acquire and activate new users who complete onboarding in our product.',
  volume: 'Drive measurable transaction or usage volume tied to real customer activity.',
  leads: 'Generate qualified B2B leads that book demos or start trials.',
};

export function getChipsForField(
  field: SuggestField,
  ctx: JudgingContext,
): SuggestionChip[] {
  const descLen = ctx.description.trim().length;
  const instrLen = ctx.instructions.trim().length;
  const proofLines = ctx.proofRequirements
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean).length;

  if (field === 'description') {
    const chips: SuggestionChip[] = [];
    if (descLen === 0) {
      if (ctx.name.trim()) {
        chips.push({ id: 'from-name', label: 'From competition name', intent: 'from_name', mode: 'ai' });
      }
      chips.push(
        { id: 'one-liner', label: 'Draft one-liner', intent: 'draft_one_liner', mode: 'ai' },
        { id: 'type-goal', label: 'Type example', intent: 'type_example', mode: 'local' },
      );
    } else if (descLen < 60) {
      chips.push(
        { id: 'specific', label: 'Make it specific', intent: 'make_specific', mode: 'ai' },
        { id: 'metric', label: 'Add measurable goal', intent: 'add_metric', mode: 'local' },
      );
    } else {
      chips.push({ id: 'polish-desc', label: 'Polish wording', intent: 'polish_description', mode: 'ai' });
    }
    return chips;
  }

  if (field === 'instructions') {
    const chips: SuggestionChip[] = [];
    if (instrLen === 0) {
      chips.push(
        { id: 'draft', label: 'Draft from goal', intent: 'draft_from_goal', mode: 'ai' },
        { id: 'counts', label: 'What counts', intent: 'what_counts', mode: 'local' },
        { id: 'verify', label: 'How you verify', intent: 'how_verify', mode: 'local' },
      );
    } else if (instrLen < 80) {
      chips.push(
        { id: 'expand', label: 'Expand rules', intent: 'expand_rules', mode: 'ai' },
        { id: 'disqualify', label: 'Add disqualifiers', intent: 'disqualifiers', mode: 'local' },
        { id: 'verify', label: 'How you verify', intent: 'how_verify', mode: 'local' },
      );
    } else {
      chips.push(
        { id: 'polish', label: 'Polish wording', intent: 'polish', mode: 'ai' },
        { id: 'disqualify', label: 'Add disqualifiers', intent: 'disqualifiers', mode: 'local' },
      );
    }
    return chips;
  }

  const chips: SuggestionChip[] = [];
  if (proofLines === 0) {
    chips.push(
      { id: 'checklist', label: 'Starter checklist', intent: 'starter_checklist', mode: 'local' },
      { id: 'proof-ai', label: 'Suggest proof items', intent: 'suggest_proof', mode: 'ai' },
    );
  } else if (proofLines < 3) {
    chips.push(
      { id: 'more-proof', label: 'Add more proof types', intent: 'more_proof', mode: 'ai' },
      { id: 'privacy', label: 'Privacy note', intent: 'privacy_note', mode: 'local' },
    );
  } else {
    chips.push(
      { id: 'privacy', label: 'Privacy note', intent: 'privacy_note', mode: 'local' },
      { id: 'format', label: 'Format tips', intent: 'format_tips', mode: 'local' },
    );
  }

  if (ctx.competitionType === 'users') {
    chips.push({ id: 'utm', label: 'UTM / referral', intent: 'proof_utm', mode: 'local' });
  } else if (ctx.competitionType === 'volume') {
    chips.push({ id: 'txn', label: 'Transaction ID', intent: 'proof_txn', mode: 'local' });
  } else {
    chips.push({ id: 'crm', label: 'CRM screenshot', intent: 'proof_crm', mode: 'local' });
  }

  return chips;
}

export function applyLocalChip(
  field: SuggestField,
  intent: string,
  current: string,
  ctx: JudgingContext,
): string {
  const goal = ctx.description.trim() || ctx.name.trim() || 'the stated growth goal';
  const typeLabel = TYPE_LABEL[ctx.competitionType];

  if (field === 'description') {
    switch (intent) {
      case 'type_example':
        return DESCRIPTION_BY_TYPE[ctx.competitionType];
      case 'add_metric':
        return appendBlock(
          current,
          ctx.competitionType === 'users'
            ? 'Success means net-new users who reach activation (not just signups).'
            : ctx.competitionType === 'volume'
              ? 'Success means verified revenue or usage volume during the competition window.'
              : 'Success means qualified leads that match our ICP and complete the required milestone.',
        );
      default:
        return current;
    }
  }

  if (field === 'instructions') {
    switch (intent) {
      case 'what_counts':
        return appendBlock(
          current,
          `What counts toward this ${typeLabel} competition:\n• Actions that clearly support: ${goal}\n• Submissions with complete proof (see checklist below)\n• Activity within the competition dates`,
        );
      case 'how_verify':
        return appendBlock(
          current,
          ctx.competitionType === 'users'
            ? 'How we verify: Founders review each submission against product analytics or admin exports (e.g. Mixpanel, Amplitude, internal dashboard). Approved actions earn points; rejected submissions do not.'
            : ctx.competitionType === 'volume'
              ? 'How we verify: Founders match proof to billing or usage records (e.g. Stripe dashboard, revenue export, usage logs). Only approved milestones earn points.'
              : 'How we verify: Founders confirm leads in CRM (HubSpot, Salesforce, etc.) and check that the milestone (demo, trial, qualified lead) actually occurred.',
        );
      case 'disqualifiers':
        return appendBlock(
          current,
          'What does not count:\n• Spam, bots, or duplicate accounts\n• Activity outside the competition window\n• Proof that cannot be tied to the participant or is missing required fields',
        );
      default:
        return current;
    }
  }

  switch (intent) {
    case 'starter_checklist':
      if (ctx.competitionType === 'users') {
        return [
          'Referral or UTM link used',
          'Screenshot of analytics showing the event (date visible)',
          'Anonymized user ID or signup confirmation',
        ].join('\n');
      }
      if (ctx.competitionType === 'volume') {
        return [
          'Transaction or invoice reference (redact sensitive data)',
          'Stripe or billing export screenshot with date range',
          'Usage metric screenshot with timestamp',
        ].join('\n');
      }
      return [
        'CRM record screenshot (contact + stage)',
        'Company name and lead email',
        'Proof the milestone happened (demo invite, trial link, etc.)',
      ].join('\n');
    case 'proof_utm':
      return appendProofLine(current, 'Referral or UTM link used for the conversion');
    case 'proof_txn':
      return appendProofLine(current, 'Transaction or invoice ID (sensitive fields redacted)');
    case 'proof_crm':
      return appendProofLine(current, 'CRM screenshot showing contact and pipeline stage');
    case 'privacy_note':
      return appendProofLine(
        current,
        'Redact passwords, full card numbers, and unrelated customer data',
      );
    case 'format_tips':
      return appendProofLine(
        current,
        'Prefer PNG/PDF exports with visible dates; one proof item per line',
      );
    default:
      return current;
  }
}
