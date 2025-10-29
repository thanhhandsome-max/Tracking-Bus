"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as authService from './services/auth.service'
import { api } from './api'

export type UserRole = "admin" | "driver" | "parent"

type User = {
  id: string
  name: string
  email: string
  role?: UserRole | string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Only access localStorage after component mounts (client-side only)
    const token = localStorage.getItem('ssb_token')
    if (token) {
      api.setToken(token)
      authService
        .fetchProfile()
        .then((u) => setUser(u))
        .catch(() => {
          // if fetching profile fails, clear stored auth
          authService.logout()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      // fallback: try to read user from storage
      const u: User | null = authService.getCurrentUserFromStorage()
      if (u) setUser(u)
      setLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    setLoading(true)
    try {
      const u = await authService.login(email, password)
      setUser(u)
      return u
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    setUser(null)
    await authService.logout()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
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
