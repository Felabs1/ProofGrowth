import { z } from 'zod';

export const suggestFieldSchema = z.object({
  field: z.enum(['description', 'instructions', 'proofRequirements']),
  competitionType: z.enum(['users', 'volume', 'leads']),
  name: z.string().optional(),
  description: z.string().optional(),
  currentText: z.string(),
  intent: z.string().optional(),
});

export type SuggestFieldInput = z.infer<typeof suggestFieldSchema>;

const TYPE_LABEL: Record<SuggestFieldInput['competitionType'], string> = {
  users: 'user acquisition',
  volume: 'volume and revenue',
  leads: 'leads and B2B',
};

function appendBlock(current: string, block: string): string {
  const base = current.trim();
  if (!base) return block.trim();
  return `${base}\n\n${block.trim()}`;
}

const DESCRIPTION_BY_TYPE: Record<SuggestFieldInput['competitionType'], string> = {
  users: 'Acquire and activate new users who complete onboarding in our product.',
  volume: 'Drive measurable transaction or usage volume tied to real customer activity.',
  leads: 'Generate qualified B2B leads that book demos or start trials.',
};

function buildTemplateSuggestion(input: SuggestFieldInput): string {
  const goal = input.description?.trim() || input.name?.trim() || 'the growth goal';
  const typeLabel = TYPE_LABEL[input.competitionType];
  const current = input.currentText;

  if (input.field === 'description') {
    switch (input.intent) {
      case 'from_name':
        return input.name?.trim()
          ? `Reward participants who deliver ${typeLabel} results for “${input.name.trim()}”.`
          : DESCRIPTION_BY_TYPE[input.competitionType];
      case 'draft_one_liner':
        return input.name?.trim()
          ? `Drive growth for ${input.name.trim()} through verified ${typeLabel} outcomes.`
          : DESCRIPTION_BY_TYPE[input.competitionType];
      case 'make_specific':
        return appendBlock(
          current,
          `Focus: measurable ${typeLabel} outcomes founders can verify manually.`,
        );
      case 'polish_description':
        return current.trim();
      case 'add_metric':
        return appendBlock(
          current,
          input.competitionType === 'users'
            ? 'Target: net-new activated users during the competition.'
            : input.competitionType === 'volume'
              ? 'Target: verified volume or revenue in the competition window.'
              : 'Target: qualified leads that complete the stated milestone.',
        );
      case 'type_example':
        return DESCRIPTION_BY_TYPE[input.competitionType];
      default:
        return current.trim() || DESCRIPTION_BY_TYPE[input.competitionType];
    }
  }

  if (input.field === 'proofRequirements') {
    if (input.intent === 'more_proof' || input.intent === 'suggest_proof') {
      const extras =
        input.competitionType === 'users'
          ? ['Date-stamped analytics export', 'Participant notes explaining the cohort']
          : input.competitionType === 'volume'
            ? ['CSV export snippet with transaction IDs', 'Short note tying proof to the milestone']
            : ['LinkedIn or company URL for the lead', 'Calendar or email proof of demo/trial'];
      let next = current.trim();
      for (const line of extras) {
        if (!next.toLowerCase().includes(line.toLowerCase())) {
          next = next ? `${next}\n${line}` : line;
        }
      }
      return next;
    }
    return current;
  }

  switch (input.intent) {
    case 'draft_from_goal':
      return [
        `Competition focus: ${goal}`,
        '',
        `What counts: Approved actions that support this ${typeLabel} goal during the competition dates, with complete proof.`,
        '',
        'What does not count: Spam, duplicates, activity outside the window, or proof that cannot be verified.',
        '',
        input.competitionType === 'users'
          ? 'How we verify: Founders review against product analytics or admin tools — not automatic on-chain verification.'
          : input.competitionType === 'volume'
            ? 'How we verify: Founders review against billing/usage dashboards (e.g. Stripe, internal reports).'
            : 'How we verify: Founders review against CRM records (HubSpot, Salesforce, etc.).',
      ].join('\n');
    case 'expand_rules':
      return appendBlock(
        current,
        `Reminder: only ${typeLabel} activity tied to "${goal}" counts. Submissions need clear proof; founders approve or reject manually.`,
      );
    case 'polish':
      return current.trim();
    default:
      if (!current.trim()) {
        return buildTemplateSuggestion({ ...input, intent: 'draft_from_goal' });
      }
      return appendBlock(
        current,
        'Please include enough detail in your proof that a founder can verify without a live call.',
      );
  }
}

const SYSTEM_PROMPT = `You help founders write competition copy for ZaoTrak, a marketplace where participants submit proof and founders manually review and approve points. Never claim automatic or oracle verification. Be concise, practical, and fair. For "what are you rewarding", write at most 1-2 short sentences. Output only the field text — no markdown fences or preamble.`;

function buildUserPrompt(input: SuggestFieldInput): string {
  const fieldLabel =
    input.field === 'description'
      ? 'What are you rewarding (one clear line on the behavior or outcome)'
      : input.field === 'instructions'
        ? 'Instructions for participants (what counts, how founders verify)'
        : 'Required proof checklist (one item per line)';

  return [
    `Competition type: ${TYPE_LABEL[input.competitionType]}`,
    input.name ? `Competition name: ${input.name}` : '',
    input.field !== 'description' && input.description
      ? `Rewarding line: ${input.description}`
      : '',
    `Task: ${input.intent ?? 'improve'} for field "${fieldLabel}"`,
    input.currentText.trim()
      ? `Current draft:\n${input.currentText.trim()}`
      : 'Current draft: (empty — write a starter)',
    'Rules: founder manual review only; no auto-verification language; plain text.',
  ]
    .filter(Boolean)
    .join('\n');
}

type LlmProvider = 'groq' | 'openai';

function resolveLlmProvider(): { provider: LlmProvider; apiKey: string; model: string } | null {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      provider: 'groq',
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile',
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    };
  }
  return null;
}

async function suggestWithLlm(
  input: SuggestFieldInput,
  llm: { provider: LlmProvider; apiKey: string; model: string },
): Promise<string> {
  const baseUrl =
    llm.provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : 'https://api.openai.com/v1';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: 0.35,
      max_tokens: 700,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `${llm.provider} request failed: ${res.status} ${errText.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty AI response');
  return text.replace(/^```[\w]*\n?|\n?```$/g, '').trim();
}

export async function suggestCompetitionField(
  input: SuggestFieldInput,
): Promise<{ suggestion: string; source: 'ai' | 'template' }> {
  const llm = resolveLlmProvider();
  if (llm) {
    try {
      const suggestion = await suggestWithLlm(input, llm);
      return { suggestion, source: 'ai' };
    } catch (e) {
      console.warn('AI suggest fallback to template:', e);
    }
  }
  return { suggestion: buildTemplateSuggestion(input), source: 'template' };
}
