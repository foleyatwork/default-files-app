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
  return 'data' in data && Array.isArray(data.data) && data.data[0]?.object === 'fileChannel';
}

// Sample res:
// -----------
// {
//   id: '7fab5265-d39e-43cf-98ce-713bc0b13e73',
//   object: 'folder',
//   data: 'cjRpZqY-p/9cb04ef6-ed4f-4445-9f75-8e7979e2421f',
//   createdBy: 'ab8c27c0-4948-4de0-a870-f6dbd12d9b92',
//   createdAt: '2023-10-12T10:24:23.072969339Z',
//   updatedAt: '2023-10-12T10:24:23.072969339Z',
//   channelId: 'cjRpZqY-p/9cb04ef6-ed4f-4445-9f75-8e7979e2421f',
//   fields: { linkUrl: '', path: 'test-folder', name: 'test-folder' }
// }
interface CreateFileRes { }
const isCreateFileRes = (data: any): data is CreateFileRes => {
  return 'channelId' in data;
}

export async function POST(request: Request) {
  const data = await request.json();
  if (!isClientCreatedWebhook(data)) {
    throw new Error('Invalid request');
  }
  if (!process.env.COPILOT_API_KEY) {
    throw new Error('Missing Copilot API key');
  }
  const listChannelsRes = await fetch(`${COPILOT_API_BASE}/channels/files?memberId=${data.data.id}`, {
    headers: {
      'x-api-key': process.env.COPILOT_API_KEY,
    }
  });
  const channelsData = await listChannelsRes.json();
  if (!isFileChannelRes(channelsData)) {
    throw new Error('File channel not found');
  }
  const channelId = channelsData.data[0].id;

  const createFolderRes = await fetch(`${COPILOT_API_BASE}/files/folder`, {
    body: JSON.stringify({
      path: '/test-folder',
      channelId,
    }),
    headers: {
      'x-api-key': process.env.COPILOT_API_KEY,
    },
    method: 'POST',
  });
  const createFolderData = await createFolderRes.json();
  if (!isCreateFileRes(createFolderData)) {
    throw new Error('Failed to create folder');
  }

  const createFileRes = await fetch(`${COPILOT_API_BASE}/files/file`, {
    body: JSON.stringify({
      path: '/test-folder/eyee.gif',
      channelId,
    }),
    headers: {
      'x-api-key': process.env.COPILOT_API_KEY,
    },
    method: 'POST',
  });
  console.log({ createFileRes });

  return Response.json({});
}
