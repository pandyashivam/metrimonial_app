import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'node:crypto';

import { env } from '../env.js';

const s3 = new S3Client({
  region: env.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

export function generateObjectKey(profileId: string, mime: string): string {
  const ext =
    mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'bin';
  const rand = randomBytes(12).toString('hex');
  return `profiles/${profileId}/${Date.now()}-${rand}.${ext}`;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
}

export async function signedGetUrl(key: string, ttlSeconds = 600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }), {
    expiresIn: ttlSeconds,
  });
}

export function publicUrl(key: string) {
  if (env.AWS_S3_PUBLIC_URL) {
    return `${env.AWS_S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${key}`;
}
