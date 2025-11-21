import { createFileRoute } from "@tanstack/react-router";
import { FileManager } from "@/components/file-upload/file-manager";

export const Route = createFileRoute("/files")({
	component: FilesRoute,
});

function FilesRoute() {
	return (
		<div className="container mx-auto w-full max-w-4xl mt-6">
			<FileManager />
		</div>
	);
}
