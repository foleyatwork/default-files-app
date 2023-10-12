const BaseApiURL = 'https://api-beta.copilot.com/v1'

export class CopilotAPI {
    apiKey: string

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    async getApiData<T>(path: string): Promise<T> {
        const response = await fetch(`${BaseApiURL}/${path}`, {
            headers: {
                'x-api-key': this.apiKey
            }
        });

        const data = await response.json()
        return data
      }

    async me() {
        return this.getApiData<MeResponse>('me')
    }

    async getClient(clientId: string) {
        return this.getApiData<Client>(`clients/${clientId}`)
    }

    async getCompany(companyId: string) {
        return this.getApiData<Company>(`companies/${companyId}`)
    }
}
