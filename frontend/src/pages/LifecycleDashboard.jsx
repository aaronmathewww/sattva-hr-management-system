import { useEffect, useState } from 'react';

const API_BASE = 'http://127.0.0.1:8001/api/v1';

function readStoredToken() {
  // Supports common storage keys without displaying the token.
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    ''
  );
}

function formatLabel(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatCard({ label, value, hint }) {
  return (
    <article className="lifecycle-stat-card">
      <p className="lifecycle-muted">{label}</p>
      <strong className="lifecycle-stat-value">{value}</strong>
      {hint && <p className="lifecycle-muted">{hint}</p>}
    </article>
  );
}

export default function LifecycleDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(readStoredToken);

  async function loadDashboard(currentToken) {
    setLoading(true);
    setError('');

    if (!currentToken) {
      setError(
        'No saved access token was found. Sign in through Sattva first, then return here.'
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/lifecycle/overview`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your session could not be verified. Sign in again and retry.'
          );
        }
        if (response.status === 403) {
          throw new Error(
            'Your account does not have permission to view this dashboard.'
          );
        }
        throw new Error(`Unable to load the dashboard (HTTP ${response.status}).`);
      }

      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(token);
    // Initial load only; the Retry button explicitly reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    const freshToken = readStoredToken();
    setToken(freshToken);
    loadDashboard(freshToken);
  }

  const isIntern = data && !Array.isArray(data.interns) && data.intern;
  const internRows = isIntern ? [data] : (data?.interns || []);

  return (
    <main className="lifecycle-page">
      <header className="lifecycle-header">
        <div>
          <p className="lifecycle-eyebrow">SATTVA · INTERN EXPERIENCE</p>
          <h1>Lifecycle overview</h1>
          <p className="lifecycle-muted">
            Progress with purpose. Growth through values.
          </p>
        </div>
        <button className="lifecycle-button" onClick={retry} type="button">
          Refresh
        </button>
      </header>

      {loading && (
        <section className="lifecycle-panel" role="status">
          Loading lifecycle information…
        </section>
      )}

      {!loading && error && (
        <section className="lifecycle-panel lifecycle-error" role="alert">
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <button className="lifecycle-button" onClick={retry} type="button">
            Try again
          </button>
        </section>
      )}

      {!loading && !error && data && (
        <>
          {isIntern ? (
            <>
              <section className="lifecycle-stats">
                <StatCard
                  label="Lifecycle items"
                  value={data.progress?.total_records ?? 0}
                />
                <StatCard
                  label="Completed items"
                  value={data.progress?.completed_records ?? 0}
                />
                <StatCard
                  label="Overall progress"
                  value={`${data.progress?.completion_percent ?? 0}%`}
                  hint="Based on recorded lifecycle items"
                />
              </section>
              <InternCard item={data} />
            </>
          ) : (
            <>
              <section className="lifecycle-stats">
                <StatCard label="Interns" value={data.total_interns ?? 0} />
                <StatCard
                  label="Completed lifecycle items"
                  value={internRows.reduce(
                    (sum, item) =>
                      sum + (item.progress?.completed_records ?? 0),
                    0
                  )}
                />
                <StatCard
                  label="Total lifecycle items"
                  value={internRows.reduce(
                    (sum, item) => sum + (item.progress?.total_records ?? 0),
                    0
                  )}
                />
              </section>

              <section className="lifecycle-panel">
                <h2>Intern directory</h2>
                {internRows.length === 0 ? (
                  <p className="lifecycle-muted">
                    No intern profiles are available for your account.
                  </p>
                ) : (
                  <div className="lifecycle-table-wrap">
                    <table className="lifecycle-table">
                      <thead>
                        <tr>
                          <th>Intern</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Progress</th>
                          <th>Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internRows.map((item) => (
                          <tr key={item.intern.user_id}>
                            <td>
                              <strong>{item.intern.full_name}</strong>
                              <small>{item.intern.intern_code || 'No intern code'}</small>
                            </td>
                            <td>{item.intern.department || '—'}</td>
                            <td>
                              <span className="lifecycle-status">
                                {formatLabel(item.intern.status)}
                              </span>
                            </td>
                            <td>
                              <div
                                className="lifecycle-progress"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={item.progress?.completion_percent ?? 0}
                                aria-label={`${item.intern.full_name} lifecycle progress`}
                              >
                                <span
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, item.progress?.completion_percent ?? 0)
                                    )}%`,
                                  }}
                                />
                              </div>
                              <small>
                                {item.progress?.completion_percent ?? 0}%
                              </small>
                            </td>
                            <td>
                              {item.progress?.completed_records ?? 0} /{' '}
                              {item.progress?.total_records ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {internRows.map((item) => (
                <InternCard key={item.intern.user_id} item={item} />
              ))}
            </>
          )}
        </>
      )}

      <footer className="lifecycle-footer">
        Building a better future, together.
      </footer>
    </main>
  );
}

function InternCard({ item }) {
  return (
    <section className="lifecycle-panel">
      <h2>{item.intern.full_name}</h2>
      <p className="lifecycle-muted">
        {item.intern.department || 'Department not set'} ·{' '}
        {item.intern.intern_code || 'Intern code not set'}
      </p>

      <div className="lifecycle-module-grid">
        {Object.entries(item.modules || {}).map(([kind, module]) => (
          <article className="lifecycle-module" key={kind}>
            <h3>{formatLabel(kind)}</h3>
            <p>
              <strong>{module.completed}</strong> of {module.total} completed
            </p>
            {module.total > 0 ? (
              <div
                className="lifecycle-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={module.total}
                aria-valuenow={module.completed}
                aria-label={`${formatLabel(kind)} completion`}
              >
                <span
                  style={{
                    width: `${Math.min(100, (module.completed / module.total) * 100)}%`,
                  }}
                />
              </div>
            ) : (
              <p className="lifecycle-muted">No items recorded yet</p>
            )}
            {module.items?.length > 0 && (
              <ul>
                {module.items.map((entry) => (
                  <li key={entry.id}>
                    <span>{entry.title}</span>
                    <small>{formatLabel(entry.status)}</small>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
