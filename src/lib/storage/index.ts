/**
 * Storage Management using infra-kit
 * 
 * Abstraction layer for file storage operations
 */

import { getStorageClient, ensureBucket as createBucketIfNotExists } from '@infra-kit/core/storage';

export async function createPresignedUrlToUpload({
    bucketName,
    fileName,
    expiry = 3600,
}: {
    bucketName: string;
    fileName: string;
    expiry?: number;
}) {
    await createBucketIfNotExists(bucketName);
    const client = getStorageClient();
    return await client.presignedPutObject(bucketName, fileName, expiry);
}

export async function createPresignedUrlToDownload({
    bucketName,
    fileName,
    expiry = 3600,
}: {
    bucketName: string;
    fileName: string;
    expiry?: number;
}) {
    const client = getStorageClient();
    return await client.presignedGetObject(bucketName, fileName, expiry);
}

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
    await createBucketIfNotExists(bucketName);
    const client = getStorageClient();
    await client.fPutObject(bucketName, objectName, filePath, metadata);
    return objectName;
}

export async function deleteFileFromBucket({
    bucketName,
    fileName,
}: {
    bucketName: string;
    fileName: string;
}) {
    const client = getStorageClient();
    await client.removeObject(bucketName, fileName);
    return true;
}

export async function listObjectsInBucket({
    bucketName,
    prefix = '',
}: {
    bucketName: string;
    prefix?: string;
}) {
    await createBucketIfNotExists(bucketName);
    const client = getStorageClient();
    const objects: Array<{ name: string; size: number; lastModified: Date; etag: string }> = [];

    const stream = client.listObjects(bucketName, prefix, true);

    for await (const obj of stream) {
        if (obj.name && obj.size !== undefined && obj.lastModified) {
            objects.push({
                name: obj.name,
                size: obj.size,
                lastModified: obj.lastModified,
                etag: obj.etag || '',
            });
        }
    }

    return objects;
}

export async function downloadFileFromBucket({
    bucketName,
    objectName,
    filePath,
}: {
    bucketName: string;
    objectName: string;
    filePath: string;
}) {
    const client = getStorageClient();
    await client.fGetObject(bucketName, objectName, filePath);
    return filePath;
}

export async function getObjectMetadata({
    bucketName,
    objectName,
}: {
    bucketName: string;
    objectName: string;
}) {
    const client = getStorageClient();
    const stat = await client.statObject(bucketName, objectName);
    return {
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        metaData: stat.metaData,
    };
}

export async function keepLatestBackups({
    bucketName,
    prefix,
    maxBackupsToKeep,
}: {
    bucketName: string;
    prefix: string;
    maxBackupsToKeep: number;
}) {
    const objects = await listObjectsInBucket({ bucketName, prefix });

    // Sort by lastModified date (newest first)
    objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    // Keep only the latest N backups
    const toDelete = objects.slice(maxBackupsToKeep);

    let deletedCount = 0;
    for (const obj of toDelete) {
        try {
            await deleteFileFromBucket({ bucketName, fileName: obj.name });
            console.log(`Deleted old backup: ${obj.name}`);
            deletedCount++;
        } catch (error) {
            console.error(`Failed to delete backup: ${obj.name}`, error);
        }
    }

    return deletedCount;
}

// Export s3Client for backward compatibility with examples (renamed to legacyStorageClient if needed, but keeping s3Client for now to minimize churn in examples unless I update them all)
// User asked to hide "minio" and "s3" names. I should rename this.
export const legacyStorageClient = {
    get listObjects() {
        return (bucketName: string, prefix: string, recursive: boolean) => {
            const client = getStorageClient();
            return client.listObjects(bucketName, prefix, recursive);
        };
    },
    get bucketExists() {
        return async (bucketName: string) => {
            const client = getStorageClient();
            return await client.bucketExists(bucketName);
        };
    }
};
