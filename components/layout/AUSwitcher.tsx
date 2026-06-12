'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Text, Select } from '@fluentui/react-components'
import { useAUContext } from '@/context/AUContext'
import { useMockAUContext } from '@/mocks/handlers/useAUContext.mock'

export function AUSwitcher() {
  const t = useTranslations('auSwitcher')
  const { activeAU, setActiveAU, setAvailableAUs } = useAUContext()
  const { availableAUs } = useMockAUContext()

  useEffect(() => {
    if (availableAUs.length > 0) {
      setAvailableAUs(availableAUs)
      if (!activeAU) setActiveAU(availableAUs[0])
    }
  }, [availableAUs]) // eslint-disable-line react-hooks/exhaustive-deps

  if (availableAUs.length === 0) return null

  if (availableAUs.length === 1) {
    return (
      <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)', display: 'block' }}>
          {t('label')}
        </Text>
        <Text size={300} weight="semibold">{activeAU?.displayName}</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
      <Text size={200} style={{ color: 'var(--colorNeutralForeground3)', display: 'block', marginBottom: '4px' }}>
        {t('label')}
      </Text>
      <Select
        value={activeAU?.id ?? ''}
        onChange={(_, d) => {
          const au = availableAUs.find((a) => a.id === d.value)
          if (au) setActiveAU(au)
        }}
        size="small"
      >
        {availableAUs.map((au) => (
          <option key={au.id} value={au.id}>{au.displayName}</option>
        ))}
      </Select>
    </div>
  )
}
