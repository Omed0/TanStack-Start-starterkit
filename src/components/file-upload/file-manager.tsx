import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { UploadForm } from "./upload-form"
import { FileList } from "./file-list"
import { api } from "@/fn"

export function FileManager() {
    const { data, refetch, isLoading } = useQuery({
        ...api.file.getFiles.queryOptions()
    })

    const handleUploadSuccess = () => {
        refetch()
    }

    const handleFileDeleted = () => {
        refetch()
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Files</h1>
                <p className="text-muted-foreground">
                    Files description
                </p>
            </div>

            <UploadForm onUploadSuccess={handleUploadSuccess} />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <FileList files={data || []} onFileDeleted={handleFileDeleted} />
            )}
        </div>
    )
}
