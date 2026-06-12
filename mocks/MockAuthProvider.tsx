'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { MockUser } from '@/types/auth'

export const MOCK_USER: MockUser = {
  oid: 'mock-user-oid-001',
  name: 'Alex Dubois',
  email: 'alex.dubois@contoso.com',
}

interface AuthContextValue {
  user: MockUser | null
  isAuthenticated: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
})

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)

  const signIn = () => setUser(MOCK_USER)
  const signOut = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
