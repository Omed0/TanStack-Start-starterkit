import { toast } from "sonner";
import { bucketName, sizes } from "@/lib/storage/constant";
import type { File } from "@/prisma/generated/browser";
import {
  getPresignedUrls as getPresignedUrlsFn,
  saveFileInfo,
  getFileById,
} from "@/fn/files";

export type ShortFileProp = {
  originalName: string;
  size: number;
};

export type PresignedUrlProp = ShortFileProp & {
  url: string;
  fileNameInBucket: string;
};

export type FilesListProps = {
  files: File[];
  fetchFiles: () => Promise<void>;
  setFiles: (files: File[] | ((files: File[]) => File[])) => void;
};

export type UploadFilesFormUIProps = {
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadToServer: (event: React.FormEvent<HTMLFormElement>) => void;
  maxFileSize: number;
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Gets presigned urls for uploading files to Storage
 * @param formData form data with files to upload
 * @returns
 */
export const getPresignedUrls = async (files: ShortFileProp[]) => {
  const presignedUrls = await getPresignedUrlsFn({ data: files });

  return presignedUrls as PresignedUrlProp[];
};

/**
 * Uploads file to Storage directly using presigned url
 * @param presignedUrl presigned url for uploading
 * @param file  file to upload
 * @returns  response from Storage
 */
export const uploadToStorage = async (
  presignedUrl: PresignedUrlProp,
  file: globalThis.File
) => {
  const response = await fetch(presignedUrl.url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
      "Access-Control-Allow-Origin": "*",
    },
  });
  return response;
};

/**
 * Uploads files to Storage and saves file info in DB
 * @param files files to upload
 * @param presignedUrls  presigned urls for uploading
 * @param onUploadSuccess callback to execute after successful upload
 * @returns
 */
export const handleUpload = async (
  files: globalThis.File[],
  presignedUrls: PresignedUrlProp[]
) => {
  const uploadToStorageResponse = await Promise.all(
    presignedUrls.map((presignedUrl) => {
      const file = files.find(
        (file) =>
          file.name === presignedUrl.originalName &&
          file.size === presignedUrl.size
      );
      if (!file) {
        throw new Error("File not found");
      }
      return uploadToStorage(presignedUrl, file);
    })
  );

  if (uploadToStorageResponse.some((res) => res.status !== 200)) {
    toast.error("Upload failed");
    return;
  }

  const savedFiles = await saveFileInfo({ data: presignedUrls });
  return savedFiles;
};

export async function getPresignedUrl(file: File) {
  const urls = await getFileById({ data: { id: file.id } });
  return urls;
}

export const downloadFile = async (file: File) => {
  const presignedUrl = await getPresignedUrl(file);

  window.open(presignedUrl.presignedUrl, "_blank");
};

/**
 * Helper function to restore a backup
 */
export async function restoreBackup(objectName: string) {
  const { downloadFileFromBucket } = await import(
    "@/lib/storage"
  );
  const { getEnv } = await import("@/lib/env");
  const env = getEnv();

  const path = await import("path");
  const fs = await import("fs");
  const { exec } = await import("child_process");
  const { promisify } = await import("util");

  const execAsync = promisify(exec);

  try {
    // Create temporary directory for restore
    const restoreDir =
      process.platform === "win32"
        ? path.join("C:\\Temp", "restore")
        : "/tmp/restore";

    if (!fs.existsSync(restoreDir)) {
      fs.mkdirSync(restoreDir, { recursive: true });
    }

    const filename = objectName.split("/").pop() || "backup.sql";
    const localPath = path.join(restoreDir, filename);

    // Download backup from Storage
    await downloadFileFromBucket({
      bucketName,
      objectName: objectName,
      filePath: localPath,
    });

    // Decompress if it's a .gz file
    let sqlFile = localPath;
    if (filename.endsWith(".gz")) {
      const zlib = await import("zlib");
      const { pipeline } = await import("stream/promises");

      sqlFile = localPath.replace(".gz", "");
      const source = fs.createReadStream(localPath);
      const destination = fs.createWriteStream(sqlFile);
      const gunzip = zlib.createGunzip();

      await pipeline(source, gunzip, destination);
    }

    // Parse DATABASE_URL
    const dbUrl = new URL(env.DATABASE_URL);
    const dbName = dbUrl.pathname.slice(1);
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;

    // Docker container name
    const containerName = `${env.APP_NAME}-postgres`;

    // Copy SQL file into Docker container
    const containerPath = `/tmp/${path.basename(sqlFile)}`;
    await execAsync(`docker cp "${sqlFile}" ${containerName}:${containerPath}`);

    // Drop existing connections and recreate database (quote database name for special characters)
    const dropConnectionsCommand = `docker exec -e PGPASSWORD=${dbPassword} ${containerName} psql -U ${dbUser} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`;

    const dropDbCommand = `docker exec -e PGPASSWORD=${dbPassword} ${containerName} psql -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbName}\\";"`;

    const createDbCommand = `docker exec -e PGPASSWORD=${dbPassword} ${containerName} psql -U ${dbUser} -d postgres -c "CREATE DATABASE \\"${dbName}\\";"`;

    // Execute commands in sequence
    await execAsync(dropConnectionsCommand).catch(() => {
      // Ignore errors if no connections exist
    });
    await execAsync(dropDbCommand);
    await execAsync(createDbCommand);

    // Restore database using psql inside container
    const restoreCommand = `docker exec -e PGPASSWORD=${dbPassword} ${containerName} psql -U ${dbUser} -d "${dbName}" -f ${containerPath}`;

    await execAsync(restoreCommand);

    // Cleanup
    fs.unlinkSync(localPath);
    if (sqlFile !== localPath) {
      fs.unlinkSync(sqlFile);
    }
    fs.rmSync(restoreDir, { recursive: true, force: true });

    return filename;
  } catch (error) {
    throw new Error(`Restore failed: ${(error as Error).message}`);
  }
}
