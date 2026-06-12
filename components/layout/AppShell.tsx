'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/mocks/MockAuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{
        flex: 1, overflow: 'auto',
        backgroundColor: 'var(--colorNeutralBackground1)',
        padding: '32px',
      }}>
        {children}
      </main>
    </div>
  )
}
