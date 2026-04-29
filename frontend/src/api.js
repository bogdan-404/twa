const TOKEN_KEY = 'contact_manager_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
  })

  if (response.status === 401) {
    clearToken()
    window.dispatchEvent(new Event('auth-expired'))
  }

  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const data = await response.json()
      detail = data.detail || detail
    } catch {
      detail = response.statusText || detail
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function registerUser(values) {
  return request('/api/auth/register', {
    method: 'POST',
    body: values
  })
}

export async function loginUser(values) {
  const formData = new FormData()
  formData.append('username', values.username)
  formData.append('password', values.password)

  return request('/api/auth/login', {
    method: 'POST',
    body: formData
  })
}

export async function getMe() {
  return request('/api/auth/me')
}

export async function getContacts() {
  return request('/api/contacts')
}

export async function createContact(contact) {
  return request('/api/contacts', {
    method: 'POST',
    body: contact
  })
}

export async function updateContact(id, contact) {
  return request(`/api/contacts/${id}`, {
    method: 'PUT',
    body: contact
  })
}

export async function deleteContact(id) {
  return request(`/api/contacts/${id}`, {
    method: 'DELETE'
  })
}
