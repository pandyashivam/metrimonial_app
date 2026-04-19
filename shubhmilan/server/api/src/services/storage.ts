import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'node:crypto';

import { env } from '../env.js';

/**
 * S3-compatible client wired for Cloudflare R2 in production and MinIO locally.
 * We use path-style addressing (`forcePathStyle: true`) so the same code works against MinIO,
 * which doesn't support virtual-hosted bucket URLs out of the box.
 */
const s3 = new S3Client({
  endpoint: env.R2_ENDPOINT,
  region: env.R2_REGION,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: env.R2_ENDPOINT.includes('localhost') || env.R2_ENDPOINT.includes('minio'),
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
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
}

/**
 * 10-minute signed GET URL for member-only photos. Public-tagged photos are served via the
 * bucket's public base URL; request-gated photos are never returned without an explicit grant.
 */
export async function signedGetUrl(key: string, ttlSeconds = 600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), {
    expiresIn: ttlSeconds,
  });
}

export function publicUrl(key: string) {
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}
