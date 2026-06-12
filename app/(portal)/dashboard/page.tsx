'use client'

import { useTranslations } from 'next-intl'
import { Title1, Text, Button, Card } from '@fluentui/react-components'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/mocks/MockAuthProvider'
import { useAUContext } from '@/context/AUContext'
import { useMembers } from '@/hooks/useMembers'
import { useDevices } from '@/hooks/useDevices'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatDistanceToNow } from '@/lib/dates'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { user } = useAuth()
  const { activeAU } = useAUContext()
  const router = useRouter()
  const { members, isLoading: membersLoading, activeCount, blockedCount } = useMembers(activeAU?.id ?? '')
  const { devices, isLoading: devicesLoading } = useDevices(activeAU?.id ?? '')

  const recentMembers = [...members]
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .slice(0, 5)

  const stats = [
    { label: t('totalMembers'), value: members.length, loading: membersLoading },
    { label: t('activeMembers'), value: activeCount, loading: membersLoading },
    { label: t('blockedMembers'), value: blockedCount, loading: membersLoading },
    { label: t('totalComputers'), value: devices.length, loading: devicesLoading },
  ]

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <Title1>{t('welcomeTitle', { name: user?.name ?? '' })}</Title1>
        <Text size={400} style={{ color: 'var(--colorNeutralForeground2)', marginTop: '4px', display: 'block' }}>
          {t('welcomeSubtitle', { department: activeAU?.displayName ?? '...' })}
        </Text>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map(({ label, value, loading }) => (
          <Card key={label} style={{ padding: '20px' }}>
            {loading ? (
              <CardSkeleton />
            ) : (
              <>
                <Text size={600} weight="bold" style={{ display: 'block' }}>{value}</Text>
                <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>{label}</Text>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '32px' }}>
        <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: '12px' }}>
          {t('quickActions')}
        </Text>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button appearance="primary" onClick={() => router.push('/members/new')}>
            {t('addTeamMember')}
          </Button>
          <Button appearance="secondary" onClick={() => router.push('/members')}>
            {t('viewMyTeam')}
          </Button>
        </div>
      </div>

      {/* Recent members */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Text size={400} weight="semibold">{t('recentActivity')}</Text>
          <Button appearance="transparent" size="small" onClick={() => router.push('/members')}>
            {t('viewAll')}
          </Button>
        </div>
        {recentMembers.length === 0 ? (
          <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
            {t('recentActivityEmpty')}
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentMembers.map((m) => (
              <Card key={m.id} style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => router.push(`/members/${m.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text weight="semibold" style={{ display: 'block' }}>{m.displayName}</Text>
                    <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>{m.jobTitle ?? '—'}</Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
