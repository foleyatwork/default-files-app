type MeResponse = {
  givenName: string
  familyName: string
  email: string
  portalName: string
}

type ClientCustomField = string | string[]

type Client = {
  id: string
  givenName: string
  familyName: string
  email: string
  companyId: string
  customFields: Record<string, ClientCustomField>
}
