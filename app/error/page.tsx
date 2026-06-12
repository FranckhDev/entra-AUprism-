'use client'

import { useTranslations } from 'next-intl'
import { Title1, Text, Button } from '@fluentui/react-components'
import { useRouter } from 'next/navigation'

export default function ErrorPage() {
  const t = useTranslations('errors')
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '32px',
    }}>
      <Title1>{t('pageTitle')}</Title1>
      <Text size={400} style={{ color: 'var(--colorNeutralForeground3)', maxWidth: '480px' }}>
        {t('noAuScope')}
      </Text>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <Button appearance="secondary" onClick={() => router.push('/login')}>{t('contactIT')}</Button>
        <Button appearance="primary" onClick={() => router.refresh()}>{t('tryAgain')}</Button>
      </div>
    </div>
  )
}
