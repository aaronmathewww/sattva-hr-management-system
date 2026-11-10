
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export async function getDashboardSummary() {
  const token = sessionStorage.getItem('access_token');

  if (!token) {
    throw new Error('Please sign in to continue.');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(data.detail || 'Unable to load dashboard information.');
  }

  return data;
}
