import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const initialForm = {
  email: '',
  full_name: '',
  password: '',
  intern_code: '',
  department: '',
  college: '',
  mentor_id: '',
  start_date: '',
  end_date: '',
  bio: '',
};

export default function CreateIntern() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const [form, setForm] = useState(initialForm);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadManagers = useCallback(async () => {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoadingManagers(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to load manager accounts.');
      }

      const users = Array.isArray(data) ? data : data.items || [];
      setManagers(users.filter((item) => item.role === 'manager' && item.is_active));
    } catch (err) {
      setError(err.message || 'Unable to load managers.');
    } finally {
      setLoadingManagers(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (user.role !== 'hr') {
      setError('Only HR users can create intern profiles.');
      return;
    }

    if (loadingManagers) {
      setError('Wait until manager accounts finish loading.');
      return;
    }

    if (managers.length === 0) {
      setError('Create an active manager account before adding an intern.');
      return;
    }

    if (!form.mentor_id) {
      setError('Please select a manager.');
      return;
    }

    if (form.end_date && form.end_date < form.start_date) {
      setError('The end date cannot be earlier than the start date.');
      return;
    }

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Check for an existing account before attempting creation.
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const usersData = await usersResponse.json();

      if (!usersResponse.ok) {
        throw new Error(usersData.detail || 'Unable to verify existing accounts.');
      }

      const users = Array.isArray(usersData)
        ? usersData
        : usersData.items || [];

      const existingUser = users.find(
        (item) => item.email?.toLowerCase() === form.email.trim().toLowerCase()
      );

      if (existingUser) {
        throw new Error(
          'An account with this email already exists. Do not submit again. Contact HR support to complete or verify the existing profile.'
        );
      }

      const accountResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          password: form.password,
          role: 'intern',
        }),
      });

      const accountData = await accountResponse.json();

      if (accountResponse.status === 401) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!accountResponse.ok) {
        throw new Error(
          accountData.detail || 'Unable to create the intern account.'
        );
      }

      const profileResponse = await fetch(`${API_BASE_URL}/interns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_id: accountData.id,
          intern_code: form.intern_code.trim(),
          department: form.department.trim(),
          college: form.college.trim() || null,
          mentor_id: Number(form.mentor_id),
          start_date: form.start_date,
          end_date: form.end_date || null,
          bio: form.bio.trim() || null,
        }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          `The account was created, but its profile could not be created: ${
            profileData.detail || 'Unknown error'
          }. Do not submit again with the same email. Contact HR support.`
        );
      }

      setSuccess('Intern account and profile created successfully.');
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Unable to create the intern.');
    } finally {
      setLoading(false);
    }
  }

  if (user.role !== 'hr') {
    return (
      <main className="workspace-page">
        <button className="workspace-back" onClick={() => navigate('/')}>
          ← Dashboard
        </button>
        <section className="workspace-table-card" style={{ padding: 28 }}>
          <h1>Access restricted</h1>
          <p>Only HR users can create intern accounts.</p>
        </section>
      </main>
    );
  }

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #dce4ee',
    borderRadius: 10,
    fontSize: 14,
    background: '#fff',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 7,
    color: '#344054',
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <main className="workspace-page">
      <header className="workspace-page-header">
        <div>
          <button className="workspace-back" onClick={() => navigate('/interns')}>
            ← Intern Management
          </button>
          <span className="workspace-eyebrow">PEOPLE DIRECTORY</span>
          <h1>Add Intern</h1>
          <p>Create an intern account and internship profile.</p>
        </div>
      </header>

      <section className="workspace-table-card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginTop: 0 }}>Account details</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 20,
              marginTop: 24,
            }}
          >
            <div>
              <label style={labelStyle} htmlFor="full_name">Full name *</label>
              <input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={updateField}
                required
                maxLength={150}
                autoComplete="name"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="email">Email address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
                maxLength={255}
                autoComplete="email"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="password">
                Temporary password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                style={fieldStyle}
              />
            </div>
          </div>

          <h2 style={{ marginTop: 32 }}>Internship details</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 20,
              marginTop: 24,
            }}
          >
            <div>
              <label style={labelStyle} htmlFor="intern_code">Intern code *</label>
              <input
                id="intern_code"
                name="intern_code"
                value={form.intern_code}
                onChange={updateField}
                required
                maxLength={30}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="department">Department *</label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={updateField}
                required
                maxLength={120}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="college">College</label>
              <input
                id="college"
                name="college"
                value={form.college}
                onChange={updateField}
                maxLength={200}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="mentor_id">Assign manager *</label>
              <select
                id="mentor_id"
                name="mentor_id"
                value={form.mentor_id}
                onChange={updateField}
                required
                disabled={loadingManagers || managers.length === 0}
                style={fieldStyle}
              >
                <option value="">
                  {loadingManagers ? 'Loading managers...' : 'Select a manager'}
                </option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name} ({manager.email})
                  </option>
                ))}
              </select>
              {!loadingManagers && managers.length === 0 && (
                <p style={{ color: '#b42318', fontSize: 12 }}>
                  No active managers found.
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle} htmlFor="start_date">Start date *</label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={updateField}
                required
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle} htmlFor="end_date">End date</label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={updateField}
                style={fieldStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle} htmlFor="bio">Notes / profile summary</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={updateField}
                rows={4}
                maxLength={2000}
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {error && (
            <p role="alert" style={{ color: '#b42318', marginTop: 20 }}>
              {error}
            </p>
          )}

          {success && (
            <p role="status" style={{ color: '#067647', marginTop: 20 }}>
              {success}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <button
              className="workspace-primary-button"
              type="submit"
              disabled={loading || loadingManagers || managers.length === 0}
            >
              {loading ? 'Creating...' : 'Create intern'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/interns')}
              disabled={loading}
              style={{
                padding: '12px 18px',
                border: '1px solid #dce4ee',
                borderRadius: 10,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}