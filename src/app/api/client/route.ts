// Sample webhook payload:
// ----------------------
//
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

import { CopilotAPI } from "@/utils/copilotApiUtils";

interface ClientCreatedWebhook {
  eventType: 'client.created';
  data: Client;
}

const isClientCreatedWebhook = (event: any): event is ClientCreatedWebhook => {
  return 'eventType' in event && event.eventType === 'client.created';
}

// Steps:
// 1. Takes a client in.
// 2. Call list file channels with the client ID set.
// 3. Create the files within the file channel.

export async function POST(request: Request) {
  const data = await request.json();
  if (!isClientCreatedWebhook(data)) {
    throw new Error('Invalid request');
  }
  if (!process.env.COPILOT_API_KEY) {
    throw new Error('Missing Copilot API key');
  }

  const res = await fetch(`https://api-beta.copilot.com/v1/channels/files?memberId=${data.data.id}`, {
    headers: {
      'x-api-key': process.env.COPILOT_API_KEY,
    }
  });
  console.log(res.json())

  return Response.json({});
}
