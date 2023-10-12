import {
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

// Create an instance of the S3 client using S3Client service client factory
const s3Client = new S3Client({
  region: process.env.AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

type CustomError = {
  name: string
}

async function streamToBuffer(readableStream: any) {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on('data', (chunk: any) => {
      chunks.push(chunk);
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

export const GetFromS3Bucket = async (filename: string) => {
  const payload = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filename,
    ResponseContentType: 'application/pdf',
  }

  try {
    const result = await s3Client.send(new GetObjectCommand(payload));
    const file = await streamToBuffer(result.Body);
    return file
  } catch (err) {
    if ((err as CustomError).name === 'AccessDenied') {
      return {}
    }
    throw err
  }
}
