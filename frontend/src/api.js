const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res, defaultErrorMsg) {
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 504 || res.status === 502) {
      throw new Error('Backend server is not running on port 3000. Please start your backend (npm run dev in root).');
    }
    const message = data && data.message ? data.message : `${defaultErrorMsg} (Status: ${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function register(name, email, password) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
  } catch (err) {
    throw new Error('Unable to connect to backend server. Make sure "npm run dev" is running in the root folder.');
  }
  return await handleResponse(res, 'Registration failed');
}

export async function login(email, password) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch (err) {
    throw new Error('Unable to connect to backend server. Make sure "npm run dev" is running in the root folder.');
  }
  return await handleResponse(res, 'Login failed');
}

export async function fetchTasks(statusFilter = '', sortBy = '') {
  const params = new URLSearchParams();
  if (statusFilter) params.append('status', statusFilter);
  if (sortBy) params.append('sortBy', sortBy);

  const url = `${BASE_URL}/tasks${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, {
    headers: { ...getAuthHeader() }
  });
  const data = await handleResponse(res, 'Failed to fetch tasks');
  return data?.tasks || [];
}

export async function createTask(taskData) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(taskData)
  });
  const data = await handleResponse(res, 'Failed to create task');
  return data?.task;
}

export async function updateTask(id, updateData) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(updateData)
  });
  const data = await handleResponse(res, 'Failed to update task');
  return data?.task;
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return await handleResponse(res, 'Failed to delete task');
}
