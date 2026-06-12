import { Badge } from '@fluentui/react-components'

interface StatusBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
}

export function StatusBadge({ isActive, activeLabel = 'Active', inactiveLabel = 'Blocked' }: StatusBadgeProps) {
  return (
    <Badge
      appearance="filled"
      color={isActive ? 'success' : 'danger'}
    >
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
