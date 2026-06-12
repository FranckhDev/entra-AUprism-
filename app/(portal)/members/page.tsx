'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Title1, Text, Button, Input, Badge } from '@fluentui/react-components'
import { useRouter } from 'next/navigation'
import { useAUContext } from '@/context/AUContext'
import { useMembers } from '@/hooks/useMembers'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Member } from '@/types/member'

type Filter = 'all' | 'active' | 'blocked'

export default function MembersPage() {
  const t = useTranslations('members')
  const router = useRouter()
  const { activeAU } = useAUContext()
  const { members, isLoading, updateMember, removeMember } = useMembers(activeAU?.id ?? '')
  const { showSuccess, showError } = useToast()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [confirmMember, setConfirmMember] = useState<Member | null>(null)
  const [confirmAction, setConfirmAction] = useState<'block' | 'enable' | 'remove' | null>(null)
  const [isActing, setIsActing] = useState(false)

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' || (filter === 'active' && m.isActive) || (filter === 'blocked' && !m.isActive)
    return matchesSearch && matchesFilter
  })

  const handleConfirm = async () => {
    if (!confirmMember || !confirmAction) return
    setIsActing(true)
    try {
      if (confirmAction === 'block') {
        await updateMember(confirmMember.id, { isActive: false })
        showSuccess(t('blockSuccess', { name: confirmMember.displayName }))
      } else if (confirmAction === 'enable') {
        await updateMember(confirmMember.id, { isActive: true })
        showSuccess(t('enableSuccess', { name: confirmMember.displayName }))
      } else if (confirmAction === 'remove') {
        await removeMember(confirmMember.id)
        showSuccess(t('removeSuccess', { name: confirmMember.displayName }))
      }
    } catch {
      showError(t('errorGeneric', { ns: 'common' }))
    } finally {
      setIsActing(false)
      setConfirmMember(null)
      setConfirmAction(null)
    }
  }

  const openConfirm = (member: Member, action: 'block' | 'enable' | 'remove') => {
    setConfirmMember(member)
    setConfirmAction(action)
  }

  const confirmConfig = confirmMember && confirmAction ? {
    block: {
      title: t('blockConfirmTitle', { name: confirmMember.displayName }),
      body: t('blockConfirmBody'),
      confirmLabel: t('blockConfirmAction'),
    },
    enable: {
      title: t('enableConfirmTitle', { name: confirmMember.displayName }),
      body: t('enableConfirmBody'),
      confirmLabel: t('enableConfirmAction'),
    },
    remove: {
      title: t('removeConfirmTitle', { name: confirmMember.displayName }),
      body: t('removeConfirmBody'),
      confirmLabel: t('removeConfirmAction'),
    },
  }[confirmAction] : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title1>{t('pageTitle')}</Title1>
        <Button appearance="primary" onClick={() => router.push('/members/new')}>
          {t('addButton')}
        </Button>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
          style={{ flex: 1, maxWidth: '360px' }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'active', 'blocked'] as Filter[]).map((f) => (
            <Button
              key={f}
              appearance={filter === f ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setFilter(f)}
            >
              {t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as 'filterAll' | 'filterActive' | 'filterBlocked')}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={search ? t('emptyStateFiltered') : t('emptyState')}
          actionLabel={!search ? t('addButton') : undefined}
          onAction={!search ? () => router.push('/members/new') : undefined}
        />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colorNeutralStroke2)' }}>
              {[t('columnName'), t('columnJobTitle'), t('columnEmail'), t('columnStatus'), t('columnActions')].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--colorNeutralForeground3)', fontWeight: 600, fontSize: '12px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                style={{ borderBottom: '1px solid var(--colorNeutralStroke2)', cursor: 'pointer' }}
                onClick={() => router.push(`/members/${m.id}`)}
              >
                <td style={{ padding: '12px' }}>
                  <Text weight="semibold">{m.displayName}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size={300}>{m.jobTitle ?? '—'}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <Text size={300}>{m.email}</Text>
                </td>
                <td style={{ padding: '12px' }}>
                  <StatusBadge isActive={m.isActive} activeLabel={t('statusActive')} inactiveLabel={t('statusBlocked')} />
                </td>
                <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {m.isActive ? (
                      <Button size="small" appearance="subtle" onClick={() => openConfirm(m, 'block')}>
                        {t('blockAction')}
                      </Button>
                    ) : (
                      <Button size="small" appearance="subtle" onClick={() => openConfirm(m, 'enable')}>
                        {t('enableAction')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Confirm dialog */}
      {confirmConfig && (
        <ConfirmDialog
          open={!!confirmMember}
          onOpenChange={(open) => { if (!open) { setConfirmMember(null); setConfirmAction(null) } }}
          title={confirmConfig.title}
          body={confirmConfig.body}
          confirmLabel={confirmConfig.confirmLabel}
          onConfirm={handleConfirm}
          isLoading={isActing}
        />
      )}
    </div>
  )
}
