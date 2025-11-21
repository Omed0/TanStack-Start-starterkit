import {
	Empty,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty"
import { FileItem } from "./file-item"
import type { File } from "@/prisma/generated/browser";


interface FileListProps {
	files: File[]
	onFileDeleted: () => void
}

export function FileList({ files, onFileDeleted }: FileListProps) {
	if (files.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No files uploaded</EmptyTitle>
					<EmptyDescription>
						Upload your first file to get started
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">
					{files.length} File{files.length !== 1 ? "s" : ""}
				</h2>
			</div>
			<div className="space-y-2 max-h-[500px] overflow-y-auto rounded-md border">
				{files.map((file) => (
					<FileItem key={file.id} file={file} onFileDeleted={onFileDeleted} />
				))}
			</div>
		</div>
	)
}
