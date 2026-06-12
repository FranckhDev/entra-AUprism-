import { Skeleton, SkeletonItem } from '@fluentui/react-components'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0' }}>
          {Array.from({ length: columns }).map((_, j) => (
            <SkeletonItem key={j} style={{ flex: 1, height: '16px' }} />
          ))}
        </Skeleton>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <Skeleton style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <SkeletonItem style={{ height: '20px', width: '60%' }} />
      <SkeletonItem style={{ height: '40px', width: '40%' }} />
    </Skeleton>
  )
}
