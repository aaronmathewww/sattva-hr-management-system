import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const TAGLINE = 'Progress with purpose. Growth through values.';
const values = [
  { title: 'Integrity', detail: 'Act with honesty, fairness and transparency. Protect trust by doing what is right, even when it is difficult.' },
  { title: 'Responsibility', detail: 'Take ownership of commitments, decisions and outcomes. Follow through and communicate openly.' },
  { title: 'Excellence', detail: 'Aim for high standards, learn continuously and turn feedback into meaningful improvement.' },
  { title: 'Pioneering', detail: 'Stay curious, explore new possibilities and approach challenges with thoughtful innovation.' },
  { title: 'Unity', detail: 'Work as one team, respect different perspectives and make progress through collaboration.' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('intern');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeValue, setActiveValue] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: email.trim(), password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Unable to sign in. Please check your details.');
      if (!data.user || !data.access_token) throw new Error('The server returned an invalid sign-in response.');
      if (data.user.role !== role) throw new Error(`This account belongs to the ${data.user.role} role. Please select the correct workspace role.`);
      sessionStorage.setItem('access_token', data.access_token); sessionStorage.setItem('user', JSON.stringify(data.user)); navigate('/', { replace: true });
    } catch (err) { setError(err instanceof TypeError ? 'Unable to connect to the server. Make sure the backend is running.' : (err.message || 'Something went wrong. Please try again.')); }
    finally { setLoading(false); }
  }
  return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="auth-brand-top"><span className="sattva-mark" aria-hidden="true">s</span><div className="brand-title-stack"><span>SATTVA</span><small>HR MANAGEMENT SYSTEM</small></div></div>
      <div className="brand-message"><span className="brand-eyebrow">PURPOSE IN ACTION</span><h1>Progress with purpose. <em>Growth through values.</em></h1><p>A thoughtful workspace that brings people, learning and progress together — guided by trust, collaboration and a commitment to meaningful outcomes.</p>
        <div className="brand-value-row" aria-label="Explore the five core values">{values.map(value => <button type="button" key={value.title} className={activeValue === value.title ? 'brand-value-active' : ''} onClick={() => setActiveValue(activeValue === value.title ? '' : value.title)} aria-expanded={activeValue === value.title}>{value.title}</button>)}</div>
        <div className={`brand-value-detail ${activeValue ? 'brand-value-detail-open' : ''}`} aria-live="polite">{activeValue && <><strong>{activeValue}</strong><p>{values.find(value => value.title === activeValue)?.detail}</p></>}</div>
      </div><p className="brand-footer">Building a better future, together.</p>
    </section>
    <section className="auth-form-panel"><header className="auth-topbar"><Link to="/login" className="back-link">Sattva</Link><div className="auth-topbar-links"><Link to="/about">About Sattva</Link></div></header>
      <div className="auth-form-wrap"><div className="welcome-icon" aria-hidden="true">↗</div><p className="form-eyebrow">WELCOME BACK</p><h2>Sign in to continue</h2><p className="form-description">Enter your account details to open your workspace.</p>
        <form onSubmit={handleSubmit}><label className="field-label" htmlFor="email">Work email</label><input id="email" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="password-heading"><label className="field-label" htmlFor="password">Password</label><button type="button" className="text-button" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button></div><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
          <label className="field-label role-label" htmlFor="role">Workspace role</label><select id="role" value={role} onChange={e => setRole(e.target.value)}><option value="intern">Intern</option><option value="manager">Manager / Mentor</option><option value="hr">Human Resources (HR)</option></select>
          {error && <p className="login-error" role="alert">{error}</p>}<button type="submit" className="sign-in-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} {!loading && <span aria-hidden="true">→</span>}</button>
        </form>
      </div><footer className="auth-bottom">Sattva <span>·</span>{TAGLINE}</footer>
    </section>
  </main>;
}
