import { GetFromS3Bucket } from "@/utils/s3utils";
import FormData from "form-data";
import { createReadStream } from "fs";
import { Readable } from "stream";

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
      path: '/test-folder-2',
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
      path: '/test-folder-2/StrengthProgram.pdf',
      channelId,
    }),
    headers: {
      'x-api-key': process.env.COPILOT_API_KEY,
    },
    method: 'POST',
  });

  console.log('====================')
  const createFileData = await createFileRes.json();
  if (!('uploadUrl' in createFileData)) {
    throw new Error('Could not retrieve file upload URL');
  }

  // https://ridebill-userfiles-mobilehub-310871815.s3.us-west-2.amazonaws.com/protected/us-west-2%3Aab8c27c0-4948-4de0-a870-f6dbd12d9b92/files/120a95ed-5181-47eb-b21b-ce94f3021c19/2023-10-12T10%3A34%3A07Z/eyee.gif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQJQGUNGITCVB5527%2F20231012%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20231012T103407Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEPn%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCbCUSCb1pY%2BfK2BeNq0nRVDsxwMiZw7rQKpQlUaX3mNwIgOojP2XAd1sLChIqLTBcV9urvf0wPkje2OPa5mtAyDoQqjQMIEhAGGgwwMjA0MTUwMTUzMTMiDHw1UC6GHGfcs%2F3ZTCrqAqP%2FiQv2xG2MW8EmOjW701%2F67WNZgQHHgzK8Hv5m0ktvviM3Df7QAx6x6Q4J8BJHeeM4SbnFsbB3x1G2AOZMmZUlYPNC7cG3gPdeEKS7UGr6DfOclvcy9TZ2EThFlaxOPQ5M706tuqpZaKKRzGCvWmDFFSgIEtYdu3U6vLdLCh6rQ8O%2BBQKLacqwdUUPy63XNNjpjh%2BuM%2FmW2yOLhCTT4j8cHduKmrybWEudTJLqusJjmBAwM6D5kCOa7QdXqDFDdxOhTO0raYt6I0UxCkP1ZLziNKo8zwhHWFMWdHnyFhU%2FLCwvfWruUiIMl7PvG9GzHR1NMrHbYM4D7FdB5GD9eaD8AkxpgCFVxD2KXXZmoJfo7SJ%2FnF%2FPqDERCKkXo4AqmjiywTQnkzHkYU1kE7M0pOkwn6VST7ooabcDg%2BsR6J3MmP%2FTfbUW31S6PUiSlRinNKdHRHFjSYRj8LanDhFgcbcdBZBbM2m81x7TMIvjnqkGOp0Bm1PgklIYRqerxzIfHYMkBhVJKJfFb9q5xgU20EDcakslj7%2FrVoQqbpajKAYFe1VtyhAIsR7bGA3dmH1E8rnNF1F5oo6voAJak8gKLWp0GLS15JgpfKKmnA6zQ74TB4pFkmqXu3RxboIzp5MWkBX67tcLBsjc3dtcvudbrv8U1ViahOOKiKv46To4mFkNmu401bZKN05BebKkydBWvg%3D%3D&X-Amz-SignedHeaders=host&X-Amz-Signature=643afc65cea6cf64837f5709da2a1e2582206393fe5891b2e07487bcac5b9ca2
  console.log('====================')
  const file = await GetFromS3Bucket('StrengthProgram.pdf');
  console.log({file})
  const uploadFileToS3Res = await fetch(createFileData.uploadUrl, {
    body: file as BodyInit,
    // @ts-ignore
    duplex: 'half',
    method: 'PUT',
    headers: {
      ContentType: 'application/octet-stream',
    },
  });
  const res = await uploadFileToS3Res.json();

  return Response.json({});
}
