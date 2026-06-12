'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Title1, Text, Button, Input } from '@fluentui/react-components'
import { useRouter } from 'next/navigation'
import { useAUContext } from '@/context/AUContext'
import { useDevices } from '@/hooks/useDevices'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatDistanceToNow } from '@/lib/dates'

type Filter = 'all' | 'active' | 'disabled'

export default function DevicesPage() {
  const t = useTranslations('devices')
  const router = useRouter()
  const { activeAU } = useAUContext()
  const { devices, isLoading } = useDevices(activeAU?.id ?? '')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = devices.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'active' && d.isEnabled) || (filter === 'disabled' && !d.isEnabled)
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <Title1 style={{ marginBottom: '24px' }}>{t('pageTitle')}</Title1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          style={{ flex: 1, maxWidth: '360px' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'active', 'disabled'] as Filter[]).map((f) => (
            <Button key={f} appearance={filter === f ? 'primary' : 'subtle'} size="small" onClick={() => setFilter(f)}>
              {t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as 'filterAll' | 'filterActive' | 'filterDisabled')}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t('emptyState')} />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colorNeutralStroke2)' }}>
              {[t('columnName'), t('columnOS'), t('columnOSVersion'), t('columnStatus'), t('columnLastSeen'), t('columnActions')].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--colorNeutralForeground3)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                style={{ borderBottom: '1px solid var(--colorNeutralStroke2)', cursor: 'pointer' }}
                onClick={() => router.push(`/devices/${d.id}`)}
              >
                <td style={{ padding: '12px' }}><Text weight="semibold" style={{ fontFamily: 'monospace' }}>{d.name}</Text></td>
                <td style={{ padding: '12px' }}><Text size={300}>{d.operatingSystem}</Text></td>
                <td style={{ padding: '12px' }}><Text size={300}>{d.osVersion}</Text></td>
                <td style={{ padding: '12px' }}>
                  <StatusBadge isActive={d.isEnabled} activeLabel={t('statusActive')} inactiveLabel={t('statusDisabled')} />
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
                    {formatDistanceToNow(d.lastSeen)}
                  </Text>
                </td>
                <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <Button size="small" appearance="subtle" onClick={() => router.push(`/devices/${d.id}`)}>
                    {t('viewDetails')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
