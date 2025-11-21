import { createFileRoute } from "@tanstack/react-router";
import { QueueManager } from "@/components/queue/queue-manager";

export const Route = createFileRoute("/queues")({
    component: QueuesRoute,
});

function QueuesRoute() {
    return (
        <div className="container mx-auto p-6">
            <QueueManager />
        </div>
    );
}
