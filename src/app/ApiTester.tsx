'use client';

const body = '{"eventType":"client.created","data":{"companyId":"aec96fa2-46da-447c-b9c9-1370f3a28166","createdAt":"2023-10-12T09:30:06.537513888Z","email":"test+0@copilot.com","familyName":"test","firstLoginDate":null,"givenName":"test","id":"4ae2c979-2f4c-42b6-bd02-a7316bf41adb","inviteUrl":"https://oct1220230.copilot.app/u/v_XQKfGIR","lastActiveDate":null,"lastLoginDate":null,"object":"client","status":"notInvited"}}';

export function ApiTester() {
  return (
    <button onClick={async () => {
      await fetch('/api/client', { method: 'POST', body })
    }}>HIT API</button>
  )
}
