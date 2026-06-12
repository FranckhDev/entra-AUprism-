import useSWR from 'swr'
import { mockStore } from '../store'
import { Member, CreateMemberInput } from '@/types/member'

const MOCK_TEMP_PASSWORD = 'TempP@ss2026!'
const MOCK_DOMAIN = 'contoso.com'

export function useMockMembers(_auId: string) {
  const { data, mutate, isLoading } = useSWR<Member[]>('mock/members', () =>
    Promise.resolve(mockStore.getMembers())
  )

  const createMember = async (input: CreateMemberInput): Promise<{ member: Member; tempPassword: string }> => {
    await new Promise((r) => setTimeout(r, 600))
    const newMember: Member = {
      id: `m-${Date.now()}`,
      displayName: `${input.firstName} ${input.lastName}`,
      firstName: input.firstName,
      lastName: input.lastName,
      jobTitle: input.jobTitle,
      email: `${input.emailPrefix}@${input.domain || MOCK_DOMAIN}`,
      department: input.department,
      officeLocation: input.officeLocation,
      isActive: true,
    }
    mockStore.addMember(newMember)
    await mutate()
    return { member: newMember, tempPassword: MOCK_TEMP_PASSWORD }
  }

  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400))
    mockStore.updateMember(id, updates)
    await mutate()
  }

  const removeMember = async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400))
    mockStore.removeMember(id)
    await mutate()
  }

  const members = data ?? []
  const activeCount = members.filter((m) => m.isActive).length
  const blockedCount = members.filter((m) => !m.isActive).length

  return { members, isLoading, activeCount, blockedCount, createMember, updateMember, removeMember }
}

export function useMockMember(id: string) {
  const { data, mutate, isLoading } = useSWR<Member | undefined>(`mock/members/${id}`, () =>
    Promise.resolve(mockStore.getMember(id))
  )

  const updateMember = async (updates: Partial<Member>): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400))
    mockStore.updateMember(id, updates)
    await mutate()
    // also revalidate list
    await import('swr').then(({ mutate: globalMutate }) => globalMutate('mock/members'))
  }

  return { member: data, isLoading, updateMember }
}
