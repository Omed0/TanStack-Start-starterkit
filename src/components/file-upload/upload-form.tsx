import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
	formatBytes,
	getPresignedUrls,
	handleUpload,
	type ShortFileProp,
} from "@/lib/storage/helper"
import { MAX_FILE_SIZE_S3_ENDPOINT } from "@/lib/storage/constant"

interface UploadFormProps {
	onUploadSuccess: () => void
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
	const fileInputRef = React.useRef<HTMLInputElement | null>(null)
	const [isLoading, setIsLoading] = React.useState(false)

	const uploadToServer = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsLoading(true)

		try {
			// Get File[] from FileList
			const files = Object.values(fileInputRef.current?.files || [])

			if (files.length === 0) {
				toast.error("Please select at least one file")
				return
			}

			// Validate files
			const filesInfo: ShortFileProp[] = files.map((file) => ({
				originalName: file.name,
				size: file.size,
			}))

			// Get presigned URLs from server
			const presignedUrls = await getPresignedUrls(filesInfo)

			// Upload files to S3 endpoint directly and save file info to db
			await handleUpload(files, presignedUrls)

			// Reset form
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}

			toast.success(
				`Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}`
			)
			onUploadSuccess()
		} catch (error) {
			console.error(error)
			toast.error((error as Error).message || "Error uploading files")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Upload Files</CardTitle>
				<CardDescription>
					Upload files to MinIO S3 storage. Maximum file size is{" "}
					{formatBytes(MAX_FILE_SIZE_S3_ENDPOINT)}.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={uploadToServer} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="file">Select Files</FieldLabel>
						<Input
							id="file"
							type="file"
							multiple
							required
							ref={fileInputRef}
							disabled={isLoading}
							title={`Maximum file size is ${formatBytes(MAX_FILE_SIZE_S3_ENDPOINT)}`}
							className="cursor-pointer"
						/>
					</Field>
					<Button type="submit" disabled={isLoading} className="w-full">
						{isLoading ? "Uploading..." : "Upload Files"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
