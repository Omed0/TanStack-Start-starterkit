import { createServerFn } from "@tanstack/react-start";
import { authMiddleware, dbMiddleware } from "@/lib/tanstack-utils/middlewares";
import { z, nanoid } from "zod";
import {
  type PresignedUrlProp,
  type ShortFileProp,
} from "@/lib/storage/helper";
import {
  LIMIT_FILES,
  expiry,
  bucketName,
} from "@/lib/storage/constant";
import {
  createPresignedUrlToDownload,
  createPresignedUrlToUpload,
  deleteFileFromBucket,
} from "@/lib/storage";

/**
 * Get all files
 */
export const getFiles = createServerFn({ method: "GET" })
  .middleware([authMiddleware, dbMiddleware])
  .handler(async ({ context }) => {
    const files = await context.db.file.findMany({
      take: LIMIT_FILES,
      orderBy: {
        createdAt: "desc",
      },
    });
    return files;
  });

/**
 * Generate presigned URLs for file uploads
 */
export const getPresignedUrls = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.custom<ShortFileProp[]>())
  .handler(async ({ data }) => {
    if (!data.length) {
      throw new Error("No files to upload.");
    }
    if (data.length > LIMIT_FILES) {
      throw new Error(`You can upload up to ${LIMIT_FILES} files at a time.`);
    }

    const presignedUrls = [] as PresignedUrlProp[];

    await Promise.all(
      data.map(async (file) => {
        const fileName = `${nanoid()}-${file?.originalName}`;

        // get presigned url using s3 sdk
        const url = await createPresignedUrlToUpload({
          bucketName,
          fileName,
          expiry,
        });

        // add presigned url to the list
        presignedUrls.push({
          fileNameInBucket: fileName,
          originalName: file.originalName,
          size: file.size,
          url,
        });
      })
    );

    return presignedUrls;
  });

/**
 * Save file information to database after upload
 */
export const saveFileInfo = createServerFn({ method: "POST" })
  .middleware([authMiddleware, dbMiddleware])
  .inputValidator(z.custom<PresignedUrlProp[]>())
  .handler(async ({ data, context }) => {
    const saveFilesInfo = await context.db.file.createMany({
      skipDuplicates: true,
      data: data.map((file: PresignedUrlProp) => ({
        bucket: bucketName,
        originalName: file.originalName,
        fileName: file.fileNameInBucket,
        size: file.size,
      })),
    });

    if (!saveFilesInfo) {
      throw new Error("Failed to save file info in DB.");
    }
    return saveFilesInfo;
  });

/**
 * Get file download URL by ID
 */
export const getFileById = createServerFn({ method: "GET" })
  .middleware([authMiddleware, dbMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const fileObject = await context.db.file.findUnique({
      where: { id: data.id },
      select: { fileName: true },
    });

    if (!fileObject) {
      throw new Error("File not found.");
    }

    const presignedUrl = await createPresignedUrlToDownload({
      bucketName,
      fileName: fileObject.fileName,
    });

    return { presignedUrl };
  });

/**
 * Delete a file from storage and database
 */
export const deleteFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware, dbMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    // Get the file name in bucket from the database
    const fileObject = await context.db.file.findUnique({
      where: { id: data.id },
      select: { fileName: true },
    });

    if (!fileObject) {
      throw new Error("File not found.");
    }

    await deleteFileFromBucket({
      bucketName,
      fileName: fileObject?.fileName,
    });

    // Delete the file record from the database
    const deletedFile = await context.db.file.delete({
      where: { id: data.id },
    });

    if (!deletedFile) {
      throw new Error("File not found.");
    }

    return { success: true };
  });
