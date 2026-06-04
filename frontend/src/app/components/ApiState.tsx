export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <p style={{ color: 'var(--pg-text-sec)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
      {label}
    </p>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div style={{ padding: '2rem 0' }}>
      <p style={{ color: 'var(--pg-red)', marginBottom: 12 }}>{message}</p>
      {onRetry && (
        <button type="button" className="pg-btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
      <p style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 12 }}>
        Ensure the API is running: <code>cd backend && npm run dev</code>
      </p>
    </div>
  );
}
