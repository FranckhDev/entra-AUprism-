import useSWR, { mutate } from 'swr'
import { mockStore } from '../store'
import { AdministrativeUnit } from '@/types/au'
import auData from '../data/au.json'

const KEY = 'mock/au'

export function useMockAUContext() {
  const { data } = useSWR<AdministrativeUnit[]>(KEY, () =>
    Promise.resolve(auData as AdministrativeUnit[])
  )
  return { availableAUs: data ?? [] }
}
