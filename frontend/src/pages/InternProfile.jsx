import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API = 'http://127.0.0.1:8000/api/v1';

export default function InternProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intern, setIntern] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetch(`${API}/interns/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Unable to load intern profile.');
        return data;
      })
      .then(setIntern)
      .catch((err) => setError(err.message || 'Unable to load intern profile.'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <main className="workspace-page"><h2>Loading profile...</h2></main>;
  if (error) return <main className="workspace-page"><button onClick={() => navigate('/interns')}>← Back to interns</button><p role="alert">{error}</p></main>;
  if (!intern) return null;

  const fields = [
    ['Full name', intern.full_name], ['Email', intern.email], ['Intern code', intern.intern_code],
    ['Department', intern.department], ['College', intern.college], ['Mentor user ID', intern.mentor_id],
    ['Start date', intern.start_date], ['End date', intern.end_date], ['Status', intern.status],
    ['About', intern.bio],
  ];

  return (
    <main className="workspace-page">
      <button className="workspace-back" onClick={() => navigate('/interns')}>← Back to interns</button>
      <header className="workspace-page-header"><div><span className="workspace-eyebrow">INTERN PROFILE</span><h1>{intern.full_name || 'Intern profile'}</h1><p>{intern.intern_code} · {intern.department}</p></div></header>
      <section className="workspace-table-card" style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22 }}>
          {fields.map(([label, value]) => <div key={label}><div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>{label}</div><div style={{ color: '#12315a', fontWeight: 600, overflowWrap: 'anywhere' }}>{value || '—'}</div></div>)}
        </div>
      </section>
    </main>
  );
}
