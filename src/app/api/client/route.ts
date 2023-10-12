const COPILOT_API_BASE = 'https://api-beta.copilot.com/v1';

// Webhook steps overview:
// -----------------------
// 1. Takes a client in.
// 2. Call list file channels with the client ID set.
// 3. Create the files within the file channel.

// Sample webhook payload:
// -----------------------
// {
//   data: {
//     eventType: 'client.created',
//     data: {
//       companyId: 'aec96fa2-46da-447c-b9c9-1370f3a28166',
//       createdAt: '2023-10-12T09:30:06.537513888Z',
//       email: 'test+0@copilot.com',
//       familyName: 'test',
//       firstLoginDate: null,
//       givenName: 'test',
//       id: '20597de1-fa49-4736-ae93-8d6e315d4cd7',
//       inviteUrl: 'https://oct1220230.copilot.app/u/v_XQKfGIR',
//       lastActiveDate: null,
//       lastLoginDate: null,
//       object: 'client',
//       status: 'notInvited'
//     }
//   }
// }
interface ClientCreatedWebhook { eventType: 'client.created'; data: Client; }
const isClientCreatedWebhook = (data: any): data is ClientCreatedWebhook => {
  return 'eventType' in data && data.eventType === 'client.created';
}

// Sample res:
// -----------
// {
//   data: [
//     {
//       id: 'cjRpZqY-p/84847aba-b48a-4b62-b4da-999e87699f6a',
//       object: 'fileChannel',
//       createdAt: '2023-10-12T09:57:34.636933883Z',
//       updatedAt: '2023-10-12T09:57:34.636933883Z',
//       membershipType: 'individual',
//       membershipEntityId: '84847aba-b48a-4b62-b4da-999e87699f6a',
//       memberIds: [Array]
//     }
//   ]
// }
interface FileChannelRes { data: { id: string; object: 'fileChannel'; }[] }
const isFileChannelRes = (data: any): data is FileChannelRes => {
  return 'data' in data && Array.isArray(data) && data[0]?.object === 'fileChannel';
}

export async function POST(request: Request) {
  const data = await request.json();
  if (!isClientCreatedWebhook(data)) {
    throw new Error('Invalid request');
  }
  if (!process.env.COPILOT_API_KEY) {
    throw new Error('Missing Copilot API key');
  }
  const res = await fetch(`${COPILOT_API_BASE}/channels/files?memberId=${data.data.id}`, {
    headers: {
      'x-api-key': process.env.COPILOT_API_KEY,
    }
  });
  const channelData = await res.json();
  if (!isFileChannelRes(channelData)) {
    throw new Error('File channel not found');
  }

  console.log({ channelId: channelData.data[0].id })

  return Response.json({});
}
