'use client'

import { FluentProvider, Toaster } from '@fluentui/react-components'
import { NextIntlClientProvider } from 'next-intl'
import { SWRConfig } from 'swr'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { AUProvider } from '@/context/AUContext'
import { MockAuthProvider } from '@/mocks/MockAuthProvider'
import { TOASTER_ID } from '@/hooks/useToast'
import messages from '@/messages/en.json'
import { ReactNode } from 'react'

function FluentWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <FluentProvider theme={theme}>
      <Toaster toasterId={TOASTER_ID} position="bottom-end" />
      {children}
    </FluentProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <SWRConfig value={{ revalidateOnFocus: false }}>
        <ThemeProvider>
          <MockAuthProvider>
            <AUProvider>
              <FluentWrapper>{children}</FluentWrapper>
            </AUProvider>
          </MockAuthProvider>
        </ThemeProvider>
      </SWRConfig>
    </NextIntlClientProvider>
  )
}
