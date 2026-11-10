import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://127.0.0.1:8000/api/v1';

export default function Interns() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadInterns = useCallback(async () => {
    const token = sessionStorage.getItem('access_token');
    if (!token) return navigate('/login');

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/interns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error(data.detail || 'Unable to load profiles.');

      setInterns(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadInterns();
  }, [loadInterns]);

  const filtered = interns.filter((intern) =>
    [
      intern.full_name,
      intern.name,
      intern.email,
      intern.intern_code,
      intern.department,
      intern.college,
      intern.status,
    ].filter(Boolean).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <main className="workspace-page">
      <header className="workspace-page-header">
        <div>
          <button className="workspace-back" onClick={() => navigate('/')}>
            ← Dashboard
          </button>
          <span className="workspace-eyebrow">PEOPLE DIRECTORY</span>
          <h1>Intern Management</h1>
          <p>View internship profiles and assigned details.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {user.role === 'hr' && (
            <button
              className="workspace-primary-button"
              onClick={() => navigate('/interns/new')}
            >
              + Add Intern
            </button>
          )}
          <button
            className="workspace-primary-button"
            onClick={loadInterns}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <section className="workspace-table-card">
        <div className="workspace-table-heading">
          <div>
            <h2>Intern profiles</h2>
            <p>Signed in as {user.full_name || 'Workspace User'}</p>
          </div>
          <span>{interns.length} profiles</span>
        </div>

        <div style={{ padding: '22px 26px' }}>
          <input
            type="search"
            aria-label="Search intern profiles"
            placeholder="Search by name, code, department or college..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              maxWidth: 500,
              padding: '12px 14px',
              border: '1px solid #dce4ee',
              borderRadius: 10,
              background: '#fff',
            }}
          />
        </div>

        {error && (
          <p role="alert" style={{ padding: '0 26px', color: '#b42318' }}>
            {error}
          </p>
        )}

        {loading ? (
          <div className="workspace-empty"><h3>Loading profiles...</h3></div>
        ) : !error && filtered.length === 0 ? (
          <div className="workspace-empty">
            <div className="workspace-empty-icon">♙</div>
            <h3>{search ? 'No matching profiles' : 'No intern profiles found'}</h3>
            <p>{search ? 'Try another search.' : 'Create an intern profile to see it here.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Intern Name', 'Email', 'Intern Code', 'Department', 'College', 'Start Date', 'End Date', 'Status', ''].map(
                    (heading, index) => (
                      <th key={`${heading}-${index}`} style={{
                        padding: '15px 20px',
                        background: '#f7f9fc',
                        color: '#526176',
                        fontSize: 12,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((intern) => (
                  <tr key={intern.id}>
                    <td style={{ padding: '17px 20px', fontWeight: 600, whiteSpace: 'nowrap' }}>{intern.full_name || intern.name || 'Name unavailable'}</td>
                    <td style={{ padding: '17px 20px' }}>{intern.email || '—'}</td>
                    <td style={{ padding: '17px 20px' }}>{intern.intern_code || `INT-${intern.id}`}</td>
                    <td style={{ padding: '17px 20px' }}>{intern.department || '—'}</td>
                    <td style={{ padding: '17px 20px' }}>{intern.college || '—'}</td>
                    <td style={{ padding: '17px 20px', whiteSpace: 'nowrap' }}>{intern.start_date || '—'}</td>
                    <td style={{ padding: '17px 20px', whiteSpace: 'nowrap' }}>{intern.end_date || '—'}</td>
                    <td style={{ padding: '17px 20px' }}>{intern.status || 'Active'}</td>
                    <td style={{ padding: '17px 20px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/interns/${intern.id}`)}
                        style={{
                          border: '1px solid #dce4ee',
                          background: '#fff',
                          color: '#12315a',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}