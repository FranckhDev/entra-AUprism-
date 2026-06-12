import membersData from './data/members.json'
import groupsData from './data/groups.json'
import devicesData from './data/devices.json'
import { Member } from '@/types/member'
import { Team, TeamMember } from '@/types/team'
import { Device } from '@/types/device'

// Module-level state — persists across component mounts within a session
let members: Member[] = membersData as Member[]
let groups: Team[] = groupsData as Team[]
let devices: Device[] = devicesData as Device[]

export const mockStore = {
  // --- Members ---
  getMembers: (): Member[] => [...members],
  getMember: (id: string): Member | undefined => members.find((m) => m.id === id),
  addMember: (member: Member): Member => {
    members = [...members, member]
    return member
  },
  updateMember: (id: string, updates: Partial<Member>): Member | undefined => {
    members = members.map((m) => (m.id === id ? { ...m, ...updates } : m))
    return members.find((m) => m.id === id)
  },
  removeMember: (id: string): void => {
    members = members.filter((m) => m.id !== id)
  },

  // --- Groups ---
  getGroups: (): Team[] => [...groups],
  getGroup: (id: string): Team | undefined => groups.find((g) => g.id === id),
  addGroupMember: (groupId: string, member: TeamMember): void => {
    groups = groups.map((g) =>
      g.id === groupId
        ? { ...g, members: [...(g.members || []), member], memberCount: g.memberCount + 1 }
        : g
    )
  },
  removeGroupMember: (groupId: string, memberId: string): void => {
    groups = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            members: (g.members || []).filter((m) => m.id !== memberId),
            memberCount: Math.max(0, g.memberCount - 1),
          }
        : g
    )
  },

  // --- Devices ---
  getDevices: (): Device[] => [...devices],
  getDevice: (id: string): Device | undefined => devices.find((d) => d.id === id),
  updateDevice: (id: string, updates: Partial<Device>): Device | undefined => {
    devices = devices.map((d) => (d.id === id ? { ...d, ...updates } : d))
    return devices.find((d) => d.id === id)
  },

  // --- Reset (for testing) ---
  reset: (): void => {
    members = membersData as Member[]
    groups = groupsData as Team[]
    devices = devicesData as Device[]
  },
}
