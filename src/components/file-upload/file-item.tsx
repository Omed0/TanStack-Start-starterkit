import { Loader2, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import type { File } from "@/prisma/generated/browser";
import { downloadFile, formatBytes } from "@/lib/file-management/s3-file-helper"
import { api } from "@/fn"


interface FileItemProps {
	file: File
	onFileDeleted: () => void
}

export function FileItem({ file, onFileDeleted }: FileItemProps) {
	const deleteFile = useMutation({
		...api.file.deleteFile.mutationOptions(),
		onSuccess: () => {
			toast.success("File deleted successfully")
			onFileDeleted()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete file")
		},
	})

	const handleDownload = async () => {
		try {
			await downloadFile(file)
			toast.success("Download started")
		} catch (error) {
			toast.error("Failed to download file")
		}
	}

	const isDeleting = deleteFile.isPending

	return (
		<div className="relative flex items-center justify-between gap-4 border-b p-4 last:border-b-0 hover:bg-muted/50 transition-colors">
			<div className="flex-1 min-w-0">
				<button
					onClick={handleDownload}
					className="text-sm font-medium text-primary hover:underline truncate block max-w-full text-left"
					disabled={isDeleting}
				>
					{file.originalName}
				</button>
				<p className="text-xs text-muted-foreground mt-1">
					{formatBytes(file.size)}
				</p>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					onClick={handleDownload}
					disabled={isDeleting}
					title="Download file"
				>
					<Download className="size-4" />
				</Button>
				<Button
					variant="destructive"
					size="icon"
					onClick={() => deleteFile.mutate({ data: { id: file.id } })}
					disabled={isDeleting}
					title="Delete file"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>

			{isDeleting && (
				<div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-sm">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			)}
		</div>
	)
}
