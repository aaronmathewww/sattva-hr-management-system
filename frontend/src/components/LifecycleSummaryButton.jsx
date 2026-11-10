
import { Link } from 'react-router-dom';

export default function LifecycleSummaryButton() {
  let user = null;

  try {
    user = JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }

  // Only HR can see this dashboard shortcut.
  if (user?.role !== 'hr') {
    return null;
  }

  return (
    <Link
      to="/lifecycle-summary"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '22px 24px',
        margin: '20px 0',
        color: '#ffffff',
        textDecoration: 'none',
        background: 'linear-gradient(135deg, #163b70, #087eae)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(22, 59, 112, 0.16)',
      }}
    >
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', opacity: 0.85 }}>
          SATTVA · GROWTH JOURNEY
        </div>

        <div style={{ fontSize: '21px', fontWeight: 750, marginTop: '8px' }}>
          Lifecycle Summary
        </div>

        <div style={{ fontSize: '14px', marginTop: '6px', opacity: 0.9 }}>
          View internship activities, learning, and progress.
        </div>
      </div>

      <span style={{ fontSize: '28px', flexShrink: 0 }} aria-hidden="true">
        →
      </span>
    </Link>
  );
}
