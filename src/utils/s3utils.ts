import {
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream'

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

export const GetFromS3Bucket = async (filename: string) => {
  const payload = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filename,
  }

  try {
    const result = await s3Client.send(new GetObjectCommand(payload))
    const stream = result.Body as Readable
    let data = ''

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => (data += chunk));
      stream.on('end', () => resolve(data));
      stream.on('error', reject);
    })
  } catch (err) {
    if ((err as CustomError).name === 'AccessDenied') {
      return {}
    }
    throw err
  }
}
