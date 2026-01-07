import crypto from "crypto";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Railway Bucket variables - supports both custom names and Railway's standard names
const bucketName = process.env.RAILWAY_BUCKET_NAME || process.env.BUCKET_NAME;
const bucketEndpoint = process.env.RAILWAY_BUCKET_ENDPOINT || process.env.BUCKET_ENDPOINT;
const bucketRegion = process.env.RAILWAY_BUCKET_REGION || process.env.BUCKET_REGION || "us-east-1";
// Railway Bucket uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY by default
const accessKeyId = process.env.RAILWAY_BUCKET_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.RAILWAY_BUCKET_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketName || !bucketEndpoint || !accessKeyId || !secretAccessKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[railwayBucket] Missing bucket configuration. Uploads will fail until env vars are set.",
  );
}

const s3Client =
  bucketName && bucketEndpoint && accessKeyId && secretAccessKey
    ? new S3Client({
        region: bucketRegion,
        endpoint: bucketEndpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

export function generateObjectKey(extension = "mp4"): string {
  const id = crypto.randomBytes(16).toString("hex");
  return `renders/${id}.${extension}`;
}

/**
 * Upload a local file to Railway Bucket and return a 7-day signed public URL.
 */
export async function uploadRenderAndGetSignedUrl(
  localPath: string,
  objectKey: string,
): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error("Railway bucket is not configured");
  }

  const stream = fs.createReadStream(localPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: stream,
      ContentType: "video/mp4",
    }),
  );

  // 7 days in seconds
  const expiresIn = 7 * 24 * 60 * 60;

  const url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
    { expiresIn },
  );

  return url;
}



