import * as Minio from "minio";
import { getEnv } from "@/lib/env";

const env = getEnv();

// Create a new Minio client with the S3 endpoint, access key, and secret key
export const s3Client = new Minio.Client({
  endPoint: env.S3_ENDPOINT,
  port: env.S3_PORT ? Number(env.S3_PORT) : undefined,
  accessKey: env.S3_ACCESS_KEY,
  secretKey: env.S3_SECRET_KEY,
  useSSL: env.S3_USE_SSL === "true",
});

export async function createBucketIfNotExists(bucketName: string) {
  const bucketExists = await s3Client.bucketExists(bucketName);
  if (!bucketExists) {
    await s3Client.makeBucket(bucketName);
  }
}

/**
 * Generate presigned urls for uploading files to S3
 * @param files files to upload
 * @returns promise with array of presigned urls
 */
export async function createPresignedUrlToUpload({
  bucketName,
  fileName,
  expiry = 60 * 60, // 1 hour
}: {
  bucketName: string;
  fileName: string;
  expiry?: number;
}) {
  // Create bucket if it doesn't exist
  await createBucketIfNotExists(bucketName);

  return await s3Client.presignedPutObject(bucketName, fileName, expiry);
}

export async function createPresignedUrlToDownload({
  bucketName,
  fileName,
  expiry = 60 * 60, // 1 hour
}: {
  bucketName: string;
  fileName: string;
  expiry?: number;
}) {
  return await s3Client.presignedGetObject(bucketName, fileName, expiry);
}

/**
 * Upload file directly to S3 bucket from file path
 * @param bucketName name of the bucket
 * @param objectName name/path of the object in bucket
 * @param filePath local file path
 * @param metadata optional metadata to attach to the object
 * @returns object name if successful
 */
export async function uploadFileToBucket({
  bucketName,
  objectName,
  filePath,
  metadata,
}: {
  bucketName: string;
  objectName: string;
  filePath: string;
  metadata?: Record<string, string>;
}) {
  // Create bucket if it doesn't exist
  await createBucketIfNotExists(bucketName);

  // Upload from file path using fPutObject (more efficient for files)
  await s3Client.fPutObject(bucketName, objectName, filePath, metadata);

  return objectName;
}

/**
 * Delete file from S3 bucket
 * @param bucketName name of the bucket
 * @param fileName name of the file
 * @returns true if file was deleted, false if not
 */
export async function deleteFileFromBucket({
  bucketName,
  fileName,
}: {
  bucketName: string;
  fileName: string;
}) {
  try {
    await s3Client.removeObject(bucketName, fileName);
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

/**
 * List objects in a bucket with optional prefix
 * @param bucketName name of the bucket
 * @param prefix optional prefix to filter objects
 * @returns array of objects with metadata
 */
export async function listObjectsInBucket({
  bucketName,
  prefix = "",
}: {
  bucketName: string;
  prefix?: string;
}) {
  // Create bucket if it doesn't exist
  await createBucketIfNotExists(bucketName);

  const objects: Array<{
    name: string;
    size: number;
    lastModified: Date;
    etag: string;
  }> = [];

  const stream = s3Client.listObjects(bucketName, prefix, true);

  for await (const obj of stream) {
    if (obj.name && obj.size !== undefined && obj.lastModified) {
      objects.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag || "",
      });
    }
  }

  return objects;
}

/**
 * Get object metadata from S3
 * @param bucketName name of the bucket
 * @param objectName name/path of the object
 * @returns object metadata
 */
export async function getObjectMetadata({
  bucketName,
  objectName,
}: {
  bucketName: string;
  objectName: string;
}) {
  // Create bucket if it doesn't exist
  await createBucketIfNotExists(bucketName);

  return await s3Client.statObject(bucketName, objectName);
}

/**
 * Keep only N latest backups in a specific prefix, delete older ones
 * Useful for maintaining a rolling backup retention policy
 * @param bucketName name of the bucket
 * @param prefix prefix where backups are stored
 * @param maxBackupsToKeep number of latest backups to keep
 * @returns number of backups deleted
 */
export async function keepLatestBackups({
  bucketName,
  prefix,
  maxBackupsToKeep,
}: {
  bucketName: string;
  prefix: string;
  maxBackupsToKeep: number;
}) {
  // List all objects with the prefix
  const objects = await listObjectsInBucket({ bucketName, prefix });

  // Sort by lastModified date (newest first)
  objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  // Keep only the latest N backups
  const toDelete = objects.slice(maxBackupsToKeep);

  let deletedCount = 0;

  for (const obj of toDelete) {
    const deleted = await deleteFileFromBucket({
      bucketName,
      fileName: obj.name,
    });

    if (deleted) {
      console.log(`Deleted old backup: ${obj.name}`);
      deletedCount++;
    } else {
      console.error(`Failed to delete backup: ${obj.name}`);
    }
  }

  return deletedCount;
}

/**
 * Download file from S3 bucket to local path
 * @param bucketName name of the bucket
 * @param objectName name/path of the object in bucket
 * @param filePath local file path to save to
 */
export async function downloadFileFromBucket({
  bucketName,
  objectName,
  filePath,
}: {
  bucketName: string;
  objectName: string;
  filePath: string;
}) {
  // Create bucket if it doesn't exist
  await createBucketIfNotExists(bucketName);

  await s3Client.fGetObject(bucketName, objectName, filePath);
  return filePath;
}
