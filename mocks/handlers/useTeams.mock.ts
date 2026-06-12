import useSWR from 'swr'
import { mockStore } from '../store'
import { Team, TeamMember } from '@/types/team'
import { Member } from '@/types/member'

export function useMockTeams(_auId: string) {
  const { data, isLoading } = useSWR<Team[]>('mock/groups', () =>
    Promise.resolve(mockStore.getGroups())
  )
  return { teams: data ?? [], isLoading }
}

export function useMockTeam(id: string) {
  const { data, mutate, isLoading } = useSWR<Team | undefined>(`mock/groups/${id}`, () =>
    Promise.resolve(mockStore.getGroup(id))
  )

  const addMember = async (member: Member): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400))
    const teamMember: TeamMember = {
      id: member.id,
      displayName: member.displayName,
      email: member.email,
      jobTitle: member.jobTitle,
      isInDepartment: true,
    }
    mockStore.addGroupMember(id, teamMember)
    await mutate()
    await import('swr').then(({ mutate: gm }) => gm('mock/groups'))
  }

  const removeMember = async (memberId: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 400))
    mockStore.removeGroupMember(id, memberId)
    await mutate()
    await import('swr').then(({ mutate: gm }) => gm('mock/groups'))
  }

  return { team: data, isLoading, addMember, removeMember }
}
