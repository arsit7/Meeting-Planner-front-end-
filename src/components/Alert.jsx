const ICONS = { error: '!', success: '✓', info: 'i' };

/** Inline status message. type: 'error' | 'success' | 'info'. Pass onDismiss to show a close button. */
export default function Alert({ type = 'info', children, onDismiss }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <div className="alert-body">{children}</div>
      {onDismiss && (
        <button type="button" className="alert-close" onClick={onDismiss} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}
