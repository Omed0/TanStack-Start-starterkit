import BackupManager from "@/components/backup/backup-manager";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/backup")({
    component: BackupRoute,
});

function BackupRoute() {
    return (
        <div className="container mx-auto p-6">
            <BackupManager />
        </div>
    );
}
