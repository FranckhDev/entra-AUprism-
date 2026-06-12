'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Title1, Text, Button } from '@fluentui/react-components'
import { useRouter, useParams } from 'next/navigation'
import { useDevice } from '@/hooks/useDevices'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatDistanceToNow } from '@/lib/dates'

export default function DeviceDetailPage() {
  const t = useTranslations('devices')
  const tc = useTranslations('common')
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { device, isLoading, updateDevice } = useDevice(id)
  const { showSuccess, showError } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isActing, setIsActing] = useState(false)

  if (isLoading) return <TableSkeleton rows={5} columns={2} />
  if (!device) return <Text>Device not found.</Text>

  const handleToggle = async () => {
    setIsActing(true)
    try {
      await updateDevice({ isEnabled: !device.isEnabled })
      showSuccess(device.isEnabled
        ? t('disableSuccess', { name: device.name })
        : t('enableSuccess', { name: device.name })
      )
    } catch {
      showError(tc('errorGeneric'))
    } finally {
      setIsActing(false)
      setConfirmOpen(false)
    }
  }

  const rows = [
    { label: t('osLabel'), value: `${device.operatingSystem} ${device.osVersion}` },
    { label: t('lastSeenLabel'), value: formatDistanceToNow(device.lastSeen) },
    { label: t('deviceIdLabel'), value: device.deviceId },
  ]

  return (
    <div style={{ maxWidth: '560px' }}>
      <Button appearance="transparent" onClick={() => router.push('/devices')} style={{ marginBottom: '16px' }}>
        ← {t('pageTitle')}
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <Title1 style={{ fontFamily: 'monospace' }}>{device.name}</Title1>
        <StatusBadge isActive={device.isEnabled} activeLabel={t('statusActive')} inactiveLabel={t('statusDisabled')} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: '16px' }}>
            <Text size={300} style={{ color: 'var(--colorNeutralForeground3)', width: '160px', flexShrink: 0 }}>{label}</Text>
            <Text size={300}>{value}</Text>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--colorNeutralStroke2)', paddingTop: '24px' }}>
        {device.isEnabled ? (
          <Button
            appearance="secondary"
            style={{ color: 'var(--colorStatusDangerForeground1)', borderColor: 'var(--colorStatusDangerBorder1)' }}
            onClick={() => setConfirmOpen(true)}
          >
            {t('disableAction')}
          </Button>
        ) : (
          <Button appearance="primary" onClick={() => setConfirmOpen(true)}>{t('enableAction')}</Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={device.isEnabled ? t('disableConfirmTitle', { name: device.name }) : t('enableConfirmTitle', { name: device.name })}
        body={device.isEnabled ? t('disableConfirmBody') : t('enableConfirmBody')}
        confirmLabel={device.isEnabled ? t('disableConfirmAction') : t('enableConfirmAction')}
        onConfirm={handleToggle}
        isLoading={isActing}
      />
    </div>
  )
}
