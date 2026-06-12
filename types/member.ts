export interface Member {
  id: string
  displayName: string
  firstName?: string
  lastName?: string
  jobTitle?: string
  email: string
  department?: string
  officeLocation?: string
  city?: string
  country?: string
  isActive: boolean
}

export interface CreateMemberInput {
  firstName: string
  lastName: string
  jobTitle?: string
  emailPrefix: string
  domain: string
  department?: string
  officeLocation?: string
}
