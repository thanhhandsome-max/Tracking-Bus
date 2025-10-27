import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as authService from './services/auth.service'
import { api } from './api'

type User = {
  id: string
  name: string
  email: string
  role?: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Load existing user from localStorage (if any)
    const u = authService.getCurrentUser()
    if (u) {
      setUser(u)
      // ensure api client has token from storage (api reads token from localStorage on init)
      const token = typeof window !== 'undefined' ? localStorage.getItem('ssb_token') : null
      api.setToken(token)
    }
    setLoading(false)
  }, [])

  async function login(username: string, password: string) {
    setLoading(true)
    const u = await authService.login(username, password)
    setUser(u)
    setLoading(false)
    return u
  }

  function logout() {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export default AuthProvider
