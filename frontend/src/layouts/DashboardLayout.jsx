import { Link, Outlet } from 'react-router-dom';
export default function DashboardLayout() {
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand-mark">HR</div><strong>Sattva</strong>
      <nav aria-label="Main navigation"><Link to="/">Home</Link><Link to="/login">Login</Link></nav>
    </aside>
    <section className="main-panel"><header className="topbar"><span>Internship Lifecycle</span><span className="status">Internship workspace</span></header><Outlet /></section>
  </div>;
}
