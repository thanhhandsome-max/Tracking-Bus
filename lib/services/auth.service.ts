import { api } from '../api'

type User = {
  id: string
  name: string
  email: string
  role?: string
}

const USER_KEY = 'ssb_user'

/**
 * Mock login implementation.
 * In real app replace with API call: api.post('/auth/login', { username, password })
 */
export async function login(username: string, password: string): Promise<User> {
  // Simple mock: accept any credentials and return a fake user and token
  const mockToken = 'mock-token-1234567890'
  const mockUser: User = {
    id: 'u-' + (username || 'anon'),
    name: username || 'Người dùng thử',
    email: `${username || 'user'}@example.com`,
    role: username === 'admin' ? 'admin' : 'parent',
  }

  // simulate network latency
  await new Promise((res) => setTimeout(res, 200))

  // store token and user locally so api client and auth-context can pick it up
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
  }
  api.setToken(mockToken)

  return mockUser
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY)
  }
  api.setToken(null)
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export default { login, logout, getCurrentUser }
