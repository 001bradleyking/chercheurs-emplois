const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'chercheurs-emplois-token'
localStorage.removeItem(TOKEN_KEY)

function expireSession() {
  setToken(null)
  window.dispatchEvent(new Event('api:unauthorized'))
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('API Laravel inaccessible. Vérifiez que le backend est démarré.')
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) expireSession()
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat()[0]
      : null
    throw new Error(validationMessage || payload?.message || `Erreur API (${response.status}).`)
  }

  return payload?.data ?? payload
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  upload: (path, file) => {
    const body = new FormData()
    body.append('cv', file)
    return request(path, { method: 'POST', body })
  },
  download: async (path) => {
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    headers.set('Accept', 'application/json')

    let response
    try {
      response = await fetch(`${API_URL}${path}`, { headers })
    } catch {
      throw new Error('API Laravel inaccessible. Vérifiez que le backend est démarré.')
    }

    if (!response.ok) {
      if (response.status === 401 && token) expireSession()
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.message || 'Téléchargement impossible.')
    }
    return response.blob()
  },
}
