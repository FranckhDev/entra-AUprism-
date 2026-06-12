export type DeviceOS = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Other'

export interface Device {
  id: string
  name: string
  operatingSystem: DeviceOS
  osVersion: string
  isEnabled: boolean
  lastSeen: string
  deviceId: string
}
