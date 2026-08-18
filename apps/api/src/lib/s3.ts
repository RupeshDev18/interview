import AWS from 'aws-sdk';
import { env } from '../config/env';
import { logger } from './logger';

let s3Client: AWS.S3 | null = null;

export function getS3Client(): AWS.S3 {
  if (!s3Client) {
    const config: AWS.S3.ClientConfiguration = {
      region: env.S3_REGION,
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    };

    // MinIO / custom S3-compatible endpoint (local dev)
    if (env.S3_ENDPOINT) {
      config.endpoint = env.S3_ENDPOINT;
      config.s3ForcePathStyle = env.S3_FORCE_PATH_STYLE ?? true;
      config.signatureVersion = 'v4';
    }

    s3Client = new AWS.S3(config);
    logger.info('S3 client initialized', {
      endpoint: env.S3_ENDPOINT ?? 'AWS S3',
      bucket: env.S3_BUCKET,
    });
  }
  return s3Client;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  fileUrl: string;
  storageKey: string;
}

export async function generatePresignedUploadUrl(
  storageKey: string,
  mimeType: string,
  expiresInSeconds = 300,
): Promise<PresignedUploadResult> {
  const s3 = getS3Client();

  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: env.S3_BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    Expires: expiresInSeconds,
  });

  const fileUrl = env.S3_ENDPOINT
    ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${storageKey}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${storageKey}`;

  return { uploadUrl, fileUrl, storageKey };
}

export async function generatePresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const s3 = getS3Client();
  return s3.getSignedUrlPromise('getObject', {
    Bucket: env.S3_BUCKET,
    Key: storageKey,
    Expires: expiresInSeconds,
  });
}

export async function deleteS3Object(storageKey: string): Promise<void> {
  const s3 = getS3Client();
  await s3
    .deleteObject({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
    })
    .promise();
}

export async function uploadToS3(
  buffer: Buffer,
  storageKey: string,
  mimeType: string,
): Promise<string> {
  const s3 = getS3Client();

  await s3
    .putObject({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
    })
    .promise();

  return env.S3_ENDPOINT
    ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${storageKey}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${storageKey}`;
}
