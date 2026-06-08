import { useMemo, useState, type CSSProperties } from 'react';
import { suggestCompetitionField } from '../api/client';
import {
  applyLocalChip,
  getChipsForField,
  type CompType,
  type JudgingContext,
  type SuggestField,
} from '../utils/competitionSuggestions';

interface FieldAssistProps {
  field: SuggestField;
  competitionType: CompType;
  name: string;
  description: string;
  instructions: string;
  proofRequirements: string;
  value: string;
  onApply: (next: string) => void;
}

const chipStyle: CSSProperties = {
  fontSize: 12,
  padding: '6px 12px',
  borderRadius: 999,
  border: '1px solid var(--pg-border)',
  background: 'var(--pg-surface)',
  color: 'var(--pg-text-sec)',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'border-color 0.15s, color 0.15s',
};

export function FieldAssist({
  field,
  competitionType,
  name,
  description,
  instructions,
  proofRequirements,
  value,
  onApply,
}: FieldAssistProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ text: string; source: string } | null>(null);

  const ctx: JudgingContext = useMemo(
    () => ({
      name,
      description,
      competitionType,
      instructions,
      proofRequirements,
    }),
    [name, description, competitionType, instructions, proofRequirements],
  );

  const chips = useMemo(() => getChipsForField(field, ctx), [field, ctx]);

  const runAi = async (intent: string) => {
    setLoading(true);
    setError(null);
    try {
      const { suggestion, source } = await suggestCompetitionField({
        field,
        competitionType,
        name: name || undefined,
        description: description || undefined,
        currentText: value,
        intent,
      });
      setPreview({ text: suggestion, source });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Suggestion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChip = async (chip: (typeof chips)[number]) => {
    setError(null);
    setPreview(null);
    if (chip.mode === 'local') {
      onApply(applyLocalChip(field, chip.intent, value, ctx));
      return;
    }
    await runAi(chip.intent);
  };

  const typeHint =
    competitionType === 'users'
      ? 'user acquisition'
      : competitionType === 'volume'
        ? 'volume'
        : 'leads';

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--pg-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Suggestions · {typeHint}
        </span>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={loading}
            style={{
              ...chipStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
            onClick={() => void handleChip(chip)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--pg-accent)';
              e.currentTarget.style.color = 'var(--pg-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--pg-border)';
              e.currentTarget.style.color = 'var(--pg-text-sec)';
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ fontSize: 12, color: 'var(--pg-text-dim)', margin: 0 }}>
          Drafting suggestion…
        </p>
      )}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--pg-danger, #EF4444)', margin: 0 }}>{error}</p>
      )}

      {preview && (
        <div
          style={{
            border: '1px solid var(--pg-accent)',
            borderRadius: 10,
            padding: '12px 14px',
            background: 'var(--pg-mid)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--pg-text-dim)',
              marginBottom: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Preview {preview.source === 'ai' ? '(AI)' : '(template)'} — edit after accepting
          </div>
          <pre
            style={{
              margin: '0 0 12px',
              whiteSpace: 'pre-wrap',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--pg-text)',
            }}
          >
            {preview.text}
          </pre>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="pg-btn pg-btn-primary"
              style={{ fontSize: 13, padding: '8px 14px' }}
              onClick={() => {
                onApply(preview.text);
                setPreview(null);
              }}
            >
              Use this
            </button>
            <button
              type="button"
              className="pg-btn"
              style={{ fontSize: 13, padding: '8px 14px' }}
              onClick={() => setPreview(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
