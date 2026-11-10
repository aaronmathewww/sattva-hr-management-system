
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LifecycleSummary.css';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const MODULES = [
  { key: 'onboarding', title: 'Onboarding', description: 'Your starting point for a successful internship.', icon: '✳', color: 'violet' },
  { key: 'goals', title: 'Goals & progress', description: 'Milestones, goals and personal growth.', icon: '◎', color: 'blue' },
  { key: 'submissions', title: 'Work submissions', description: 'Your work, evidence and progress updates.', icon: '↗', color: 'cyan' },
  { key: 'feedback', title: 'Feedback & reviews', description: 'Guidance and feedback from your mentor.', icon: '✧', color: 'amber' },
  { key: 'evaluations', title: 'Evaluations', description: 'Structured reviews of your development.', icon: '◈', color: 'rose' },
  { key: 'learning', title: 'Learning & webinars', description: 'Resources and sessions to build your skills.', icon: '⌘', color: 'green' },
  { key: 'certifications', title: 'Certifications', description: 'Achievements and verified credentials.', icon: '◇', color: 'gold' },
  { key: 'leave', title: 'Leave management', description: 'Requests, decisions and leave history.', icon: '◷', color: 'slate' },
];

const DONE_STATUSES = new Set([
  'completed',
  'verified',
  'reviewed',
  'approved',
]);

function getStatus(record) {
  return String(record.status || 'unknown').toLowerCase();
}

function isComplete(record) {
  return DONE_STATUSES.has(getStatus(record));
}

function displayStatus(status) {
  return String(status || 'unknown')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProgressRing({ percent }) {
  return (
    <div
      className="ls-ring"
      role="progressbar"
      aria-label="Overall recorded progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={{ '--ls-progress': `${percent * 3.6}deg` }}
    >
      <div className="ls-ring-inner">
        <strong>{percent}%</strong>
        <span>completed</span>
      </div>
    </div>
  );
}

export default function LifecycleSummary() {
  const [recordsByModule, setRecordsByModule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('access_token');

      if (!token) {
        setError('Please sign in to view your lifecycle summary.');
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          MODULES.map(async (module) => {
            const response = await fetch(
              `${API_BASE_URL}/workspace/${module.key}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
              }
            );

            if (response.status === 401) {
              sessionStorage.removeItem('access_token');
              sessionStorage.removeItem('user');
              throw new Error('Your session has expired. Please sign in again.');
            }

            if (!response.ok) {
              const body = await response.json().catch(() => ({}));
              throw new Error(
                body.detail ||
                  `Unable to load ${module.title} (HTTP ${response.status}).`
              );
            }

            const records = await response.json();
            return [module.key, Array.isArray(records) ? records : []];
          })
        );

        if (!cancelled) {
          setRecordsByModule(Object.fromEntries(results));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load lifecycle information.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const allRecords = Object.values(recordsByModule).flat();
  const completedCount = allRecords.filter(isComplete).length;
  const pendingCount = allRecords.length - completedCount;
  const completionPercent = allRecords.length
    ? Math.round((completedCount / allRecords.length) * 100)
    : 0;

  return (
    <main className="lifecycle-summary-page ls-page">
      <nav className="ls-topbar" aria-label="Page navigation">
        <Link to="/" className="ls-wordmark" aria-label="Sattva dashboard">
          <span className="ls-logo-mark">s</span>
          <span>SATTVA<span className="ls-wordmark-dot">.</span></span>
        </Link>

        <div className="ls-topbar-right">
          <span className="ls-topbar-label">INTERN LIFECYCLE</span>
          <Link to="/" className="ls-back-link">
            <span aria-hidden="true">←</span> Dashboard
          </Link>
          <button
            type="button"
            className="ls-refresh"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
          >
            <span className={loading ? 'ls-refresh-icon ls-spinning' : 'ls-refresh-icon'} aria-hidden="true">↻</span>
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </nav>

      <div className="ls-content">
        <header className="ls-hero">
          <div className="ls-hero-copy">
            <div className="ls-eyebrow">
              <span className="ls-eyebrow-dot" />
              YOUR GROWTH JOURNEY
            </div>
            <h1>Your journey.<br /><span>Your progress.</span></h1>
            <p className="ls-hero-description">
              Every milestone moves you forward. See your internship activities,
              learning and achievements come together in one place.
            </p>

            <div className="ls-hero-meta">
              <span className="ls-live-dot" />
              {loading ? 'Updating your journey' : error ? 'Progress temporarily unavailable' : 'Your journey at a glance'}
            </div>
          </div>

          <div className="ls-hero-visual" aria-hidden="true">
            <div className="ls-orbit ls-orbit-one" />
            <div className="ls-orbit ls-orbit-two" />
            <div className="ls-orbit ls-orbit-three" />
            <div className="ls-hero-core">
              <span className="ls-core-spark">✦</span>
              <span>GROW</span>
              <small>WITH PURPOSE</small>
            </div>
            <div className="ls-float-card ls-float-top">
              <span className="ls-float-icon">✧</span>
              <span><strong>Keep growing</strong><small>One step at a time</small></span>
            </div>
            <div className="ls-float-card ls-float-bottom">
              <span className="ls-float-check">✓</span>
              <span><strong>Progress matters</strong><small>Every milestone counts</small></span>
            </div>
          </div>
          <div className="ls-hero-glow" aria-hidden="true" />
        </header>

        {loading && (
          <section className="ls-message ls-loading" role="status">
            <span className="ls-loading-spinner" />
            <div>
              <strong>Bringing your journey together</strong>
              <p>Gathering your latest lifecycle records…</p>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="ls-message ls-error" role="alert">
            <span className="ls-error-symbol">!</span>
            <div className="ls-message-copy">
              <h2>We couldn’t load your summary</h2>
              <p>{error}</p>
              <button
                type="button"
                className="ls-primary-button"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Try again <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="ls-section-heading">
              <div>
                <span className="ls-section-kicker">THE BIG PICTURE</span>
                <h2>Your progress overview</h2>
                <p>A snapshot of the records visible to your account.</p>
              </div>
              <span className="ls-secure-label"><span /> LIVE SUMMARY</span>
            </section>

            <section className="ls-overview-grid" aria-label="Lifecycle totals">
              <article className="ls-stat-card ls-stat-total">
                <div className="ls-stat-top">
                  <span className="ls-stat-icon ls-icon-blue">▤</span>
                  <span className="ls-stat-tag">ALL MODULES</span>
                </div>
                <strong className="ls-stat-number">{allRecords.length}</strong>
                <h3>Total records</h3>
                <p>Across your available modules</p>
                <div className="ls-stat-decoration" aria-hidden="true">▤</div>
              </article>

              <article className="ls-stat-card ls-stat-done">
                <div className="ls-stat-top">
                  <span className="ls-stat-icon ls-icon-green">✓</span>
                  <span className="ls-stat-tag">ACHIEVEMENTS</span>
                </div>
                <strong className="ls-stat-number">{completedCount}</strong>
                <h3>Completed</h3>
                <p>Completed, verified, reviewed or approved</p>
                <div className="ls-stat-decoration" aria-hidden="true">✓</div>
              </article>

              <article className="ls-stat-card ls-stat-pending">
                <div className="ls-stat-top">
                  <span className="ls-stat-icon ls-icon-amber">◷</span>
                  <span className="ls-stat-tag">IN PROGRESS</span>
                </div>
                <strong className="ls-stat-number">{pendingCount}</strong>
                <h3>Remaining</h3>
                <p>Records not yet marked complete</p>
                <div className="ls-stat-decoration" aria-hidden="true">◷</div>
              </article>
            </section>

            <section className="ls-progress-panel">
              <div className="ls-progress-copy">
                <span className="ls-section-kicker">MOMENTUM</span>
                <h2>Look how far you’ve come.</h2>
                <p>
                  Your progress is based on records marked completed, verified,
                  reviewed or approved.
                </p>

                <div className="ls-progress-legend">
                  <span><i className="ls-legend-complete" /> Completed <strong>{completedCount}</strong></span>
                  <span><i className="ls-legend-remaining" /> Remaining <strong>{pendingCount}</strong></span>
                </div>
              </div>

              <ProgressRing percent={completionPercent} />

              <div className="ls-progress-side">
                <span className="ls-progress-side-label">YOUR CURRENT PACE</span>
                <strong>{completionPercent}%</strong>
                <p>
                  {allRecords.length === 0
                    ? 'Your journey starts here. Records will appear as activities are added.'
                    : completionPercent === 100
                      ? 'Everything currently recorded is marked complete. Keep up the great work.'
                      : 'Keep moving forward. Every completed activity adds to your journey.'}
                </p>
              </div>
            </section>

            <section className="ls-modules-section">
              <div className="ls-section-heading ls-module-heading">
                <div>
                  <span className="ls-section-kicker">YOUR WORKSPACE</span>
                  <h2>Every part of your journey</h2>
                  <p>Explore your activities and see where things stand.</p>
                </div>
                <span className="ls-module-total">{MODULES.length} <span>modules</span></span>
              </div>

              <div className="ls-module-grid">
                {MODULES.map((module, index) => {
                  const records = recordsByModule[module.key] || [];
                  const completed = records.filter(isComplete).length;
                  const percent = records.length
                    ? Math.round((completed / records.length) * 100)
                    : 0;

                  return (
                    <article
                      className={`ls-module-card ls-accent-${module.color}`}
                      key={module.key}
                      style={{ '--ls-card-index': index }}
                    >
                      <div className="ls-module-card-header">
                        <span className="ls-module-icon" aria-hidden="true">{module.icon}</span>
                        <span className={`ls-module-status ${records.length === 0 ? 'ls-status-empty' : completed === records.length ? 'ls-status-done' : 'ls-status-active'}`}>
                          <i />
                          {records.length === 0 ? 'No records' : completed === records.length ? 'Complete' : 'In progress'}
                        </span>
                      </div>

                      <div className="ls-module-title-row">
                        <h3>{module.title}</h3>
                        <span className="ls-module-count">{String(records.length).padStart(2, '0')}</span>
                      </div>
                      <p className="ls-module-description">{module.description}</p>

                      <div className="ls-module-progress-label">
                        <span>{completed} of {records.length} completed</span>
                        <strong>{percent}%</strong>
                      </div>
                      <div
                        className="ls-module-progress-track"
                        role="progressbar"
                        aria-label={`${module.title} completion`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                      >
                        <span style={{ width: `${percent}%` }} />
                      </div>

                      {records.length > 0 ? (
                        <ul className="ls-record-list">
                          {records.slice(0, 3).map((record) => (
                            <li key={record.id}>
                              <span className={`ls-record-dot ${isComplete(record) ? 'is-complete' : ''}`} aria-hidden="true">
                                {isComplete(record) ? '✓' : ''}
                              </span>
                              <span className="ls-record-title">{record.title || 'Untitled record'}</span>
                              <span className={`ls-record-status ${isComplete(record) ? 'is-complete' : ''}`}>
                                {displayStatus(record.status)}
                              </span>
                            </li>
                          ))}
                          {records.length > 3 && (
                            <li className="ls-more-records">
                              +{records.length - 3} more {records.length - 3 === 1 ? 'record' : 'records'}
                            </li>
                          )}
                        </ul>
                      ) : (
                        <div className="ls-empty-state">
                          <span aria-hidden="true">✧</span>
                          <p>No records just yet</p>
                        </div>
                      )}

                      <Link to={`/${module.key}`} className="ls-module-link">
                        <span>Explore module</span>
                        <span className="ls-module-arrow" aria-hidden="true">↗</span>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>

            {allRecords.length === 0 && (
              <p className="ls-no-data-note">
                No lifecycle records are currently visible. This does not necessarily
                mean that no internship activities have taken place.
              </p>
            )}
          </>
        )}

        <footer className="ls-footer">
          <div className="ls-footer-brand">
            <span className="ls-footer-mark">s</span>
            <span>SATTVA<span className="ls-wordmark-dot">.</span></span>
          </div>
          <p>Progress with purpose. Growth through values.</p>
          <span className="ls-footer-motto">Building a better future, together.</span>
        </footer>
      </div>
    </main>
  );
}
