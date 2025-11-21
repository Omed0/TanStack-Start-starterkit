
import { QueueMetricsOverview } from "@/components/queue/queue-metrics"
import { QueueList } from "@/components/queue/queue-list"

export function QueueManager() {
    return (
        <div className="w-full space-y-8 flex flex-col justify-center">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Queues
                </h1>
                <p className="text-muted-foreground">
                    Queues description
                </p>
            </div>

            <QueueMetricsOverview />

            <QueueList />
        </div>
    )
}
