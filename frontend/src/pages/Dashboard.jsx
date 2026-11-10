
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary } from '../services/dashboard';

const modules = [
  {
    number: '01',
    title: 'Intern Management',
    description: 'Profiles, placements, departments and mentor assignments.',
    icon: '♙',
    color: 'blue',
    path: '/interns',
    roles: ['hr', 'manager'],
    label: 'PEOPLE',
  },
  {
    number: '02',
    title: 'Goals & Progress',
    description: 'Turn learning objectives into clear, trackable milestones.',
    icon: '↗',
    color: 'cyan',
    path: '/goals',
    roles: ['intern', 'manager', 'hr'],
    label: 'GROWTH',
  },
  {
    number: '03',
    title: 'Feedback & Reviews',
    description: 'Keep development moving with meaningful feedback.',
    icon: '▤',
    color: 'purple',
    path: '/feedback',
    roles: ['intern', 'manager', 'hr'],
    label: 'DEVELOPMENT',
  },
  {
    number: '04',
    title: 'Leave Management',
    description: 'Manage requests, decisions and leave history.',
    icon: '◷',
    color: 'orange',
    path: '/leave',
    roles: ['intern', 'manager', 'hr'],
    label: 'WELLBEING',
  },
  {
    number: '05',
    title: 'Learning & Webinars',
    description: 'Explore learning resources and knowledge-sharing sessions.',
    icon: '◎',
    color: 'green',
    path: '/learning',
    roles: ['intern', 'manager', 'hr'],
    label: 'LEARNING',
  },
  {
    number: '06',
    title: 'Certifications',
    description: 'Keep achievements and certification verification organised.',
    icon: '◇',
    color: 'pink',
    path: '/certifications',
    roles: ['intern', 'hr'],
    label: 'ACHIEVEMENTS',
  },
  {
    number: '07',
    title: 'Onboarding',
    description: 'Guide each new joiner through essential milestones.',
    icon: '✓',
    color: 'blue',
    path: '/onboarding',
    roles: ['intern', 'hr'],
    label: 'GETTING STARTED',
  },
  {
    number: '08',
    title: 'Work Submissions',
    description: 'Share progress updates and work for review.',
    icon: '↗',
    color: 'cyan',
    path: '/submissions',
    roles: ['intern', 'manager'],
    label: 'CONTRIBUTIONS',
  },
  {
    number: '09',
    title: 'Evaluations',
    description: 'Bring reviews and internship outcomes together.',
    icon: '✳',
    color: 'purple',
    path: '/evaluations',
    roles: ['intern', 'manager', 'hr'],
    label: 'PERFORMANCE',
  },
];

function getFirstName(name) {
  return (name || 'there').trim().split(/\s+/)[0];
}

function getRoleLabel(role) {
  const labels = {
    hr: 'HR workspace',
    manager: 'Mentor workspace',
    intern: 'Intern workspace',
  };

  return labels[role] || 'Workspace';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const data = await getDashboardSummary();

        if (active) {
          setSummary(data);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your workspace.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  function signOut() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <main className="dashboard-state">
        <div className="dashboard-state-card">
          <div className="dashboard-loader" />
          <p className="premium-eyebrow">SATTVA WORKSPACE</p>
          <h2>Making space for your next milestone.</h2>
          <p>Preparing your workspace…</p>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="dashboard-state">
        <div className="dashboard-state-card">
          <div className="dashboard-state-symbol">!</div>
          <p className="premium-eyebrow">A MOMENT, PLEASE</p>
          <h2>Your workspace couldn't load.</h2>
          <p>{error || 'Please sign in again to continue.'}</p>
          <button
            className="premium-button premium-button-primary"
            onClick={() => navigate('/login', { replace: true })}
          >
            Return to sign in <span>↗</span>
          </button>
        </div>
      </main>
    );
  }

  const user = summary.user;
  const role = user.role;

  const visibleModules = modules.filter((module) =>
    module.roles.includes(role)
  );

  const isHR = role === 'hr';
  const canManageInterns = role === 'hr' || role === 'manager';

  return (
    <main className="dashboard-page premium-dashboard">
      <aside className="dashboard-sidebar premium-sidebar">
        <button
          className="premium-brand"
          onClick={() => navigate('/')}
          aria-label="Sattva home"
        >
          <span className="premium-brand-mark">S</span>
          <span className="premium-brand-copy">
            <strong>Sattva</strong>
            <small>INTERNSHIP LIFECYCLE</small>
          </span>
        </button>

        <div className="premium-sidebar-label">YOUR SPACE</div>

        <nav className="premium-navigation" aria-label="Primary navigation">
          <button
            className="premium-nav-item is-active"
            onClick={() => navigate('/')}
          >
            <span className="premium-nav-icon">⌂</span>
            <span>Overview</span>
            <span className="premium-nav-indicator" />
          </button>

          {canManageInterns && (
            <button
              className="premium-nav-item"
              onClick={() => navigate('/interns')}
            >
              <span className="premium-nav-icon">♙</span>
              <span>Intern Management</span>
              <span className="premium-nav-arrow">↗</span>
            </button>
          )}

          {isHR && (
            <button
              className="premium-nav-item"
              onClick={() => navigate('/lifecycle-summary')}
            >
              <span className="premium-nav-icon">◫</span>
              <span>Lifecycle Summary</span>
              <span className="premium-nav-arrow">↗</span>
            </button>
          )}
        </nav>

        <div className="premium-sidebar-label premium-sidebar-label-secondary">
          DISCOVER
        </div>

        <nav className="premium-navigation" aria-label="More information">
          <button
            className="premium-nav-item"
            onClick={() => navigate('/about')}
          >
            <span className="premium-nav-icon">ⓘ</span>
            <span>About Sattva</span>
            <span className="premium-nav-arrow">↗</span>
          </button>

          <button
            className="premium-nav-item"
            onClick={() => navigate('/values')}
          >
            <span className="premium-nav-icon">✳</span>
            <span>Core Values</span>
            <span className="premium-nav-arrow">↗</span>
          </button>
        </nav>

        <div className="premium-sidebar-bottom">
          <div className="premium-sidebar-orb" aria-hidden="true">
            ✦
          </div>
          <p className="premium-sidebar-quote">
            Progress with purpose.
            <br />
            Growth through values.
          </p>
          <span className="premium-sidebar-footnote">
            BUILDING A BETTER FUTURE, TOGETHER.
          </span>
        </div>
      </aside>

      <section className="dashboard-main premium-main">
        <header className="dashboard-topbar premium-topbar">
          <div className="premium-breadcrumb">
            <span>Workspace</span>
            <span className="premium-breadcrumb-slash">/</span>
            <strong>Overview</strong>
          </div>

          <div className="premium-account">
            <div className="premium-account-copy">
              <strong>{user.full_name}</strong>
              <span>{getRoleLabel(role)}</span>
            </div>

            <div className="premium-avatar" aria-hidden="true">
              {getFirstName(user.full_name).charAt(0).toUpperCase()}
            </div>

            <button
              className="premium-signout"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <span>↗</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content premium-content">
          <section className="premium-hero">
            <div className="premium-hero-grain" aria-hidden="true" />

            <div className="premium-hero-copy">
              <div className="premium-hero-kicker">
                <span className="premium-live-dot" />
                YOUR NEXT CHAPTER STARTS HERE
              </div>

              <h1>
                Welcome back,
                <br />
                <span>{getFirstName(user.full_name)}.</span>
              </h1>

              <p>
                {summary.description ||
                  'Your internship journey, connected in one thoughtful workspace.'}
              </p>

              <div className="premium-hero-actions">
                {canManageInterns && (
                  <button
                    className="premium-button premium-button-light"
                    onClick={() => navigate('/interns')}
                  >
                    Explore people <span>↗</span>
                  </button>
                )}

                {isHR && (
                  <button
                    className="premium-button premium-button-glass"
                    onClick={() => navigate('/lifecycle-summary')}
                  >
                    View lifecycle <span>→</span>
                  </button>
                )}

                {role === 'intern' && (
                  <button
                    className="premium-button premium-button-light"
                    onClick={() => navigate('/goals')}
                  >
                    View my goals <span>↗</span>
                  </button>
                )}
              </div>

              <div className="premium-hero-note">
                <span className="premium-hero-note-line" />
                Small steps. Meaningful progress.
              </div>
            </div>

            <div className="premium-hero-art" aria-hidden="true">
              <div className="premium-art-ring premium-art-ring-one" />
              <div className="premium-art-ring premium-art-ring-two" />
              <div className="premium-art-ring premium-art-ring-three" />
              <div className="premium-art-core">
                <span className="premium-art-star">✦</span>
                <span className="premium-art-s">S</span>
                <span className="premium-art-caption">GROW WITH PURPOSE</span>
              </div>
              <span className="premium-art-float premium-art-float-one">✧</span>
              <span className="premium-art-float premium-art-float-two">·</span>
              <span className="premium-art-float premium-art-float-three">✦</span>
              <div className="premium-art-pill">
                <span>✳</span> People first, always
              </div>
            </div>

            <div className="premium-hero-index" aria-hidden="true">
              SATTVA <span> / </span> 01
            </div>
          </section>

          <section className="premium-overview-strip" aria-label="Workspace overview">
            <div className="premium-overview-intro">
              <span className="premium-overview-icon">▦</span>
              <div>
                <strong>Your workspace</strong>
                <span>A considered place for meaningful work.</span>
              </div>
            </div>

            <div className="premium-overview-divider" />

            <div className="premium-overview-metric">
              <span>AVAILABLE MODULES</span>
              <strong>{String(visibleModules.length).padStart(2, '0')}</strong>
            </div>

            <div className="premium-overview-divider" />

            <div className="premium-overview-metric">
              <span>YOUR ACCESS</span>
              <strong className="premium-access-value">
                {role === 'hr'
                  ? 'HR'
                  : role === 'manager'
                    ? 'Mentor'
                    : 'Intern'}
              </strong>
            </div>

            <div className="premium-overview-end">
              <span className="premium-access-dot" />
              Personalised for you
            </div>
          </section>

          <section className="premium-modules-section">
            <div className="premium-section-heading">
              <div>
                <span className="premium-section-kicker">THE WORKSPACE</span>
                <h2>Everything in its place.</h2>
                <p>
                  The tools you need, thoughtfully brought together.
                </p>
              </div>

              <span className="premium-section-count">
                {String(visibleModules.length).padStart(2, '0')}
                <span> MODULES</span>
              </span>
            </div>

            <div className="dashboard-modules premium-module-grid">
              {visibleModules.map((module, index) => (
                <button
                  key={module.number}
                  className={`dashboard-module-card premium-module-card premium-module-${module.color}`}
                  onClick={() => navigate(module.path)}
                  style={{ '--card-index': index }}
                >
                  <div className="premium-card-topline">
                    <span className="premium-module-category">
                      {module.label}
                    </span>
                    <span className="premium-module-number">
                      {module.number}
                    </span>
                  </div>

                  <div className={`module-icon premium-module-icon ${module.color}`}>
                    {module.icon}
                  </div>

                  <h3>{module.title}</h3>
                  <p>{module.description}</p>

                  <div className="module-card-footer premium-module-footer">
                    <span>Open workspace</span>
                    <span className="module-arrow premium-module-arrow">↗</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="premium-closing-banner">
            <div className="premium-closing-mark">S</div>
            <div className="premium-closing-copy">
              <span>THE SATTVA WAY</span>
              <h2>Every milestone matters.</h2>
              <p>
                Build skills, share knowledge and make every step count.
              </p>
            </div>
            <div className="premium-closing-values">
              <span>GROW</span>
              <i />
              <span>LEARN</span>
              <i />
              <span>ACHIEVE</span>
            </div>
          </section>

          <footer className="premium-footer">
            <span>© Sattva · Internship Lifecycle</span>
            <span>Building a better future, together.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

