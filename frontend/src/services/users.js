
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function request(path, options = {}) {
  const token = sessionStorage.getItem('access_token');

  if (!token) {
    throw new Error('Please sign in to continue.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(data.detail || 'The request failed.');
  }

  return data;
}

export function getUsers() {
  return request('/users');
}

export function createUser(user) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export function deactivateUser(userId) {
  return request(`/users/${userId}/deactivate`, {
    method: 'PATCH',
  });
}
