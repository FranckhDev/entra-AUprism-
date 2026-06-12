'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Title1, Title2, Text, Button, Badge, Input, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions } from '@fluentui/react-components'
import { useRouter, useParams } from 'next/navigation'
import { useAUContext } from '@/context/AUContext'
import { useTeam } from '@/hooks/useTeams'
import { useMembers } from '@/hooks/useMembers'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { TeamMember } from '@/types/team'
import { Member } from '@/types/member'

export default function TeamDetailPage() {
  const t = useTranslations('groups')
  const tc = useTranslations('common')
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { activeAU } = useAUContext()
  const { team, isLoading, addMember, removeMember } = useTeam(id)
  const { members } = useMembers(activeAU?.id ?? '')
  const { showSuccess, showError } = useToast()

  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  if (isLoading) return <TableSkeleton rows={5} columns={3} />
  if (!team) return <Text>Group not found.</Text>

  const existingIds = new Set((team.members || []).map((m) => m.id))
  const addCandidates = members.filter(
    (m) =>
      !existingIds.has(m.id) &&
      (!addSearch || m.displayName.toLowerCase().includes(addSearch.toLowerCase()))
  )

  const handleRemove = async () => {
    if (!removeTarget) return
    setIsRemoving(true)
    try {
      await removeMember(removeTarget.id)
      showSuccess(t('removeSuccess', { name: removeTarget.displayName, group: team.displayName }))
    } catch {
      showError(tc('errorGeneric'))
    } finally {
      setIsRemoving(false)
      setRemoveTarget(null)
    }
  }

  const handleAdd = async (member: Member) => {
    setIsAdding(true)
    try {
      await addMember(member)
      showSuccess(t('addSuccess', { name: member.displayName, group: team.displayName }))
      setAddOpen(false)
      setAddSearch('')
    } catch {
      showError(tc('errorGeneric'))
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <Button appearance="transparent" onClick={() => router.push('/teams')} style={{ marginBottom: '16px' }}>
        ← {t('pageTitle')}
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <Title1 style={{ marginBottom: '4px' }}>{team.displayName}</Title1>
          {team.description && <Text size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>{team.description}</Text>}
          <div style={{ marginTop: '8px' }}>
            <Badge appearance="outline">{team.groupType === 'm365' ? t('typeM365Group') : t('typeSecurityGroup')}</Badge>
          </div>
        </div>
        <Button appearance="primary" onClick={() => setAddOpen(true)}>{t('addMember')}</Button>
      </div>

      <Title2 style={{ marginBottom: '12px' }}>{t('membersTitle')}</Title2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--colorNeutralStroke2)' }}>
            {[t('columnName'), 'Email', 'Job Title', 'Source', t('columnActions')].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--colorNeutralForeground3)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(team.members ?? []).map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid var(--colorNeutralStroke2)' }}>
              <td style={{ padding: '12px' }}><Text weight="semibold">{m.displayName}</Text></td>
              <td style={{ padding: '12px' }}><Text size={300}>{m.email}</Text></td>
              <td style={{ padding: '12px' }}><Text size={300}>{m.jobTitle ?? '—'}</Text></td>
              <td style={{ padding: '12px' }}>
                <Text size={200} style={{ color: m.isInDepartment ? 'var(--colorNeutralForeground3)' : 'var(--colorStatusWarningForeground1)' }}>
                  {m.isInDepartment ? t('inDepartment') : t('outsideDepartment')}
                </Text>
              </td>
              <td style={{ padding: '12px' }}>
                {m.isInDepartment && (
                  <Button size="small" appearance="subtle" onClick={() => setRemoveTarget(m)}>
                    {t('removeFromGroup')}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Remove confirm */}
      {removeTarget && (
        <ConfirmDialog
          open={!!removeTarget}
          onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
          title={t('removeConfirmTitle', { name: removeTarget.displayName, group: team.displayName })}
          body={t('removeConfirmBody')}
          confirmLabel={t('removeConfirmAction')}
          onConfirm={handleRemove}
          isLoading={isRemoving}
        />
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={(_, d) => { setAddOpen(d.open); setAddSearch('') }}>
        <DialogSurface style={{ maxWidth: '480px' }}>
          <DialogBody>
            <DialogTitle>{t('addMemberTitle', { group: team.displayName })}</DialogTitle>
            <DialogContent>
              <Input
                placeholder={t('addMemberSearch')}
                value={addSearch}
                onChange={(_, d) => setAddSearch(d.value)}
                style={{ width: '100%', marginBottom: '12px', marginTop: '8px' }}
              />
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {addCandidates.length === 0 ? (
                  <Text size={300} style={{ color: 'var(--colorNeutralForeground3)', padding: '8px' }}>
                    {tc('noResults')}
                  </Text>
                ) : addCandidates.map((m) => (
                  <div
                    key={m.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '4px', backgroundColor: 'var(--colorNeutralBackground2)' }}
                  >
                    <div>
                      <Text weight="semibold" style={{ display: 'block' }}>{m.displayName}</Text>
                      <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>{m.jobTitle ?? m.email}</Text>
                    </div>
                    <Button size="small" appearance="primary" onClick={() => handleAdd(m)} disabled={isAdding}>
                      {t('addMemberButton')}
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAddOpen(false)}>{tc('close')}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
