import useSWR from 'swr'
import { mockStore } from '../store'
import { Device } from '@/types/device'

export function useMockDevices(_auId: string) {
  const { data, isLoading } = useSWR<Device[]>('mock/devices', () =>
    Promise.resolve(mockStore.getDevices())
  )
  return { devices: data ?? [], isLoading }
}

export function useMockDevice(id: string) {
  const { data, mutate, isLoading } = useSWR<Device | undefined>(`mock/devices/${id}`, () =>
    Promise.resolve(mockStore.getDevice(id))
  )

  const updateDevice = async (updates: Partial<Device>): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400))
    mockStore.updateDevice(id, updates)
    await mutate()
    await import('swr').then(({ mutate: gm }) => gm('mock/devices'))
  }

  return { device: data, isLoading, updateDevice }
}
