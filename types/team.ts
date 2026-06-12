export type GroupType = 'security' | 'm365'

export interface TeamMember {
  id: string
  displayName: string
  email: string
  jobTitle?: string
  isInDepartment: boolean
}

export interface Team {
  id: string
  displayName: string
  description?: string
  groupType: GroupType
  memberCount: number
  members?: TeamMember[]
}
