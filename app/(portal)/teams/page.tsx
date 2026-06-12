'use client'

import { useTranslations } from 'next-intl'
import { Title1, Text, Button } from '@fluentui/react-components'
import { useRouter } from 'next/navigation'
import { useAUContext } from '@/context/AUContext'
import { useTeams } from '@/hooks/useTeams'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

export default function TeamsPage() {
  const t = useTranslations('groups')
  const router = useRouter()
  const { activeAU } = useAUContext()
  const { teams, isLoading } = useTeams(activeAU?.id ?? '')

  const typeLabel = (type: string) => type === 'm365' ? t('typeM365Group') : t('typeSecurityGroup')

  return (
    <div>
      <Title1 style={{ marginBottom: '24px' }}>{t('pageTitle')}</Title1>

      {isLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : teams.length === 0 ? (
        <EmptyState message={t('emptyState')} />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colorNeutralStroke2)' }}>
              {[t('columnName'), t('columnDescription'), t('columnType'), t('columnMembers'), t('columnActions')].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--colorNeutralForeground3)', fontWeight: 600, fontSize: '12px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.id}
                style={{ borderBottom: '1px solid var(--colorNeutralStroke2)', cursor: 'pointer' }}
                onClick={() => router.push(`/teams/${team.id}`)}
              >
                <td style={{ padding: '12px' }}><Text weight="semibold">{team.displayName}</Text></td>
                <td style={{ padding: '12px' }}><Text size={300}>{team.description ?? '—'}</Text></td>
                <td style={{ padding: '12px' }}><Text size={300}>{typeLabel(team.groupType)}</Text></td>
                <td style={{ padding: '12px' }}><Text size={300}>{team.memberCount}</Text></td>
                <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <Button size="small" appearance="subtle" onClick={() => router.push(`/teams/${team.id}`)}>
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
