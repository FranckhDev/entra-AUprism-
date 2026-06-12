import { Text, Button } from '@fluentui/react-components'
import { ReactNode } from 'react'

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({ message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: '16px', textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: '48px', opacity: 0.4 }}>{icon}</div>}
      <Text size={400} style={{ color: 'var(--colorNeutralForeground3)' }}>{message}</Text>
      {actionLabel && onAction && (
        <Button appearance="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
