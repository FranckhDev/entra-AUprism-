'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { AdministrativeUnit } from '@/types/au'

interface AUContextValue {
  activeAU: AdministrativeUnit | null
  availableAUs: AdministrativeUnit[]
  setActiveAU: (au: AdministrativeUnit) => void
  setAvailableAUs: (aus: AdministrativeUnit[]) => void
}

const AUContext = createContext<AUContextValue>({
  activeAU: null,
  availableAUs: [],
  setActiveAU: () => {},
  setAvailableAUs: () => {},
})

export function AUProvider({ children }: { children: ReactNode }) {
  const [activeAU, setActiveAU] = useState<AdministrativeUnit | null>(null)
  const [availableAUs, setAvailableAUs] = useState<AdministrativeUnit[]>([])

  return (
    <AUContext.Provider value={{ activeAU, availableAUs, setActiveAU, setAvailableAUs }}>
      {children}
    </AUContext.Provider>
  )
}

export function useAUContext() {
  return useContext(AUContext)
}
