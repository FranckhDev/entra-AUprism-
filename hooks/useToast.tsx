'use client'

import { useToastController, Toast, ToastTitle, ToastBody } from '@fluentui/react-components'

export const TOASTER_ID = 'global-toaster'

export function useToast() {
  const { dispatchToast } = useToastController(TOASTER_ID)

  const showSuccess = (title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent: 'success', timeout: 5000 }
    )
  }

  const showError = (title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent: 'error', timeout: -1 }
    )
  }

  return { showSuccess, showError }
}
