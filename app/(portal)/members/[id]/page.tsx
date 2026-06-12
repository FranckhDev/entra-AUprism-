'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Title1, Title2, Text, Button, Input, Field } from '@fluentui/react-components'
import { useRouter, useParams } from 'next/navigation'
import { useAUContext } from '@/context/AUContext'
import { useMember } from '@/hooks/useMembers'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Member } from '@/types/member'

export default function MemberDetailPage() {
  const t = useTranslations('members')
  const tc = useTranslations('common')
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { activeAU } = useAUContext()
  const { member, isLoading, updateMember } = useMember(id)
  const { showSuccess, showError } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Member>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'block' | 'enable' | null>(null)
  const [isActing, setIsActing] = useState(false)

  if (isLoading) return <TableSkeleton rows={6} columns={2} />
  if (!member) return <Text>{t('fieldNotSet')}</Text>

  const startEdit = () => {
    setEditForm({
      displayName: member.displayName, jobTitle: member.jobTitle,
      department: member.department, officeLocation: member.officeLocation,
      city: member.city, country: member.country,
    })
    setIsEditing(true)
  }

  const saveEdit = async () => {
    setIsSaving(true)
    try {
      await updateMember(editForm)
      showSuccess(t('updateSuccess'))
      setIsEditing(false)
    } catch {
      showError(tc('errorGeneric'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusToggle = async () => {
    setIsActing(true)
    try {
      await updateMember({ isActive: !member.isActive })
      showSuccess(member.isActive ? t('blockSuccess', { name: member.displayName }) : t('enableSuccess', { name: member.displayName }))
    } catch {
      showError(tc('errorGeneric'))
    } finally {
      setIsActing(false)
      setConfirmAction(null)
    }
  }

  const fields: { label: string; key: keyof Member; editable: boolean }[] = [
    { label: t('fieldDisplayName'), key: 'displayName', editable: true },
    { label: t('fieldJobTitle'), key: 'jobTitle', editable: true },
    { label: t('fieldDepartment'), key: 'department', editable: true },
    { label: t('fieldEmail'), key: 'email', editable: false },
    { label: t('fieldOfficeLocation'), key: 'officeLocation', editable: true },
    { label: t('fieldCity'), key: 'city', editable: true },
    { label: t('fieldCountry'), key: 'country', editable: true },
  ]

  return (
    <div style={{ maxWidth: '640px' }}>
      <Button appearance="transparent" onClick={() => router.push('/members')} style={{ marginBottom: '16px' }}>
        ← {t('pageTitle')}
      </Button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <Title1 style={{ marginBottom: '4px' }}>{member.displayName}</Title1>
          <Text size={400} style={{ color: 'var(--colorNeutralForeground3)' }}>{member.jobTitle ?? '—'}</Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StatusBadge isActive={member.isActive} activeLabel={t('statusActive')} inactiveLabel={t('statusBlocked')} />
          {!isEditing && (
            <Button appearance="secondary" size="small" onClick={startEdit}>{t('editDetails')}</Button>
          )}
        </div>
      </div>

      {/* Profile fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {fields.map(({ label, key, editable }) => (
          <div key={key} style={{ display: 'flex', gap: '16px' }}>
            <Text size={300} style={{ color: 'var(--colorNeutralForeground3)', width: '160px', flexShrink: 0, paddingTop: '6px' }}>
              {label}
            </Text>
            {isEditing && editable ? (
              <Input
                size="small"
                value={(editForm[key] as string) ?? ''}
                onChange={(_, d) => setEditForm((f) => ({ ...f, [key]: d.value }))}
                style={{ flex: 1 }}
              />
            ) : (
              <Text size={300} style={{ paddingTop: '6px' }}>
                {(member[key] as string) ?? <span style={{ color: 'var(--colorNeutralForeground4)' }}>{t('fieldNotSet')}</span>}
                {!editable && isEditing && (
                  <Text size={200} style={{ color: 'var(--colorNeutralForeground4)', marginLeft: '8px' }}>
                    ({t('readOnlyField')})
                  </Text>
                )}
              </Text>
            )}
          </div>
        ))}
      </div>

      {/* Edit actions */}
      {isEditing && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <Button appearance="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>{tc('cancel')}</Button>
          <Button appearance="primary" onClick={saveEdit} disabled={isSaving}>
            {isSaving ? 'Saving...' : tc('save')}
          </Button>
        </div>
      )}

      {/* Account status */}
      <div style={{ borderTop: '1px solid var(--colorNeutralStroke2)', paddingTop: '24px' }}>
        <Title2 style={{ marginBottom: '12px' }}>{t('accountStatus')}</Title2>
        {member.isActive ? (
          <Button
            appearance="secondary"
            style={{ color: 'var(--colorStatusDangerForeground1)', borderColor: 'var(--colorStatusDangerBorder1)' }}
            onClick={() => setConfirmAction('block')}
          >
            {t('blockAction')}
          </Button>
        ) : (
          <Button appearance="primary" onClick={() => setConfirmAction('enable')}>{t('enableAction')}</Button>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null) }}
        title={confirmAction === 'block' ? t('blockConfirmTitle', { name: member.displayName }) : t('enableConfirmTitle', { name: member.displayName })}
        body={confirmAction === 'block' ? t('blockConfirmBody') : t('enableConfirmBody')}
        confirmLabel={confirmAction === 'block' ? t('blockConfirmAction') : t('enableConfirmAction')}
        onConfirm={handleStatusToggle}
        isLoading={isActing}
      />
    </div>
  )
}
