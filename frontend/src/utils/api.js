const BASE_URL = '/api';

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('idealab_token');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok && response.status === 401) {
      if (!endpoint.includes('/auth/login')) {
        localStorage.removeItem('idealab_token');
        localStorage.removeItem('idealab_user');
      }
    }

    return data;
  } catch (err) {
    console.error(`API Request Error [${method} ${endpoint}]:`, err);
    return {
      success: false,
      message: 'Network error or backend server unreachable. Please check connection.'
    };
  }
}
