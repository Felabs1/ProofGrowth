const PREFIX = '[ZaoTrak]';

/** Log when running dev server or VITE_DEBUG=true */
export function isDebugEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';
}

export function debugLog(scope: string, message: string, data?: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;
  if (data && Object.keys(data).length > 0) {
    console.log(`${PREFIX} ${scope}: ${message}`, data);
  } else {
    console.log(`${PREFIX} ${scope}: ${message}`);
  }
}

export function debugError(
  scope: string,
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`${PREFIX} ${scope} ERROR: ${message}`, {
    ...context,
    name: err.name,
    message: err.message,
    stack: err.stack,
    cause: err.cause,
  });
}

/** Log unhandled errors / rejections with file:line when available */
export function installGlobalDebugHandlers(): void {
  if (!isDebugEnabled()) return;

  window.addEventListener('error', (event) => {
    debugError('window.error', event.message, event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    debugError('unhandledrejection', 'Promise rejected', event.reason);
  });

  debugLog('debug', 'Global error handlers installed (dev / VITE_DEBUG)');
}
