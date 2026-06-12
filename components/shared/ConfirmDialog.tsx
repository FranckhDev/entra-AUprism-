'use client'

import {
  Dialog, DialogTrigger, DialogSurface, DialogTitle,
  DialogBody, DialogContent, DialogActions, Button,
} from '@fluentui/react-components'
import { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  confirmLabel: string
  confirmAppearance?: 'primary' | 'secondary' | 'subtle' | 'transparent' | 'outline'
  onConfirm: () => void
  isLoading?: boolean
  trigger?: ReactNode
}

export function ConfirmDialog({
  open, onOpenChange, title, body, confirmLabel,
  confirmAppearance = 'primary', onConfirm, isLoading, trigger,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      {trigger && <DialogTrigger disableButtonEnhancement>{trigger}</DialogTrigger>}
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent style={{ color: 'var(--colorNeutralForeground2)' }}>{body}</DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button appearance={confirmAppearance} onClick={onConfirm} disabled={isLoading}>
              {isLoading ? 'Please wait...' : confirmLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
