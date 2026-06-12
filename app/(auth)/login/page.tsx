'use client'

import { useTranslations } from 'next-intl'
import { Button, Text, Title1, Card, CardHeader } from '@fluentui/react-components'
import { useAuth } from '@/mocks/MockAuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const t = useTranslations('auth')
  const { signIn, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: 'var(--colorNeutralBackground2)',
    }}>
      <Card style={{ padding: '48px', width: '400px', textAlign: 'center' }}>
        <CardHeader
          header={
            <div>
              <Text size={700} weight="bold" style={{ color: 'var(--colorBrandForeground1)', display: 'block', marginBottom: '8px' }}>
                AUPrism
              </Text>
              <Title1 style={{ display: 'block', marginBottom: '8px' }}>{t('signIn')}</Title1>
              <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
                {t('signInDescription')}
              </Text>
            </div>
          }
        />
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button appearance="primary" size="large" onClick={signIn} style={{ width: '100%' }}>
            {t('mockSignIn')}
          </Button>
          <Text size={200} style={{ color: 'var(--colorNeutralForeground4)' }}>
            {t('mockSignInDescription')}
          </Text>
        </div>
      </Card>
    </div>
  )
}
