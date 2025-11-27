import { useQuery, useMutation } from "@tanstack/react-query"
import { Pause, Play, Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/fn"
import type { QueueName } from "@/lib/jobs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export function QueueList() {
    const { data, isLoading, refetch, isRefetching } = useQuery(
        api.queue.getQueuesStatus.queryOptions(),
    )

    const pauseQueue = useMutation({
        ...api.queue.pauseQueue.mutationOptions(),
        onSuccess: (data) => {
            toast.success(data.message)
            refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to pause queue")
        },
    })

    const resumeQueue = useMutation({
        ...api.queue.resumeQueue.mutationOptions(),
        onSuccess: (data) => {
            toast.success(data.message)
            refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to resume queue")
        },
    })

    const cleanQueue = useMutation({
        ...api.queue.cleanQueue.mutationOptions(),
        onSuccess: (data) => {
            toast.success(`Cleaned ${data.cleaned} jobs from ${data.queueName}`)
            refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to clean queue")
        },
    })

    const handleTogglePause = (queueName: QueueName, isPaused: boolean) => {
        if (isPaused) {
            resumeQueue.mutate({ data: { queueName } })
        } else {
            pauseQueue.mutate({ data: { queueName } })
        }
    }

    const handleCleanQueue = (queueName: QueueName) => {
        cleanQueue.mutate({
            data: {
                queueName,
                grace: 3600000, // 1 hour
                limit: 100,
                status: "completed",
            },
        })
    }

    if (isLoading) {
        return <QueueListSkeleton />
    }

    if (!data || !data.queues) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <section className="flex items-center justify-between">
                    <div>
                        <CardTitle>Queue Status</CardTitle>
                        <CardDescription>
                            Manage and monitor your BullMQ queues
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                    >
                        <RefreshCw className={`size-5 ${isRefetching && "animate-spin"}`} />
                    </Button>
                </section>
            </CardHeader>
            <CardContent>
                <section className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Queue Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Waiting</TableHead>
                                <TableHead className="text-right">Active</TableHead>
                                <TableHead className="text-right">Completed</TableHead>
                                <TableHead className="text-right">Failed</TableHead>
                                <TableHead className="text-right">Delayed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.queues.map((queue) => (
                                <TableRow key={queue.name}>
                                    <TableCell className="font-medium">{queue.name}</TableCell>
                                    <TableCell>
                                        {queue.error ? (
                                            <Badge variant="destructive">Error</Badge>
                                        ) : queue.isPaused ? (
                                            <Badge variant="secondary">
                                                <Pause className="h-3 w-3 mr-1" />
                                                Paused
                                            </Badge>
                                        ) : (
                                            <Badge variant="default">
                                                <Play className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {queue.metrics?.waiting ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {queue.metrics?.active ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {queue.metrics?.completed ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {queue.metrics?.failed ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {queue.metrics?.delayed ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    handleTogglePause(
                                                        queue.name as QueueName,
                                                        queue.isPaused || false
                                                    )
                                                }
                                                disabled={
                                                    pauseQueue.isPending || resumeQueue.isPending
                                                }
                                                title={queue.isPaused ? "Resume" : "Pause"}
                                            >
                                                {queue.isPaused ? (
                                                    <Play className="h-4 w-4" />
                                                ) : (
                                                    <Pause className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    handleCleanQueue(queue.name as QueueName)
                                                }
                                                disabled={cleanQueue.isPending}
                                                title="Clean completed jobs"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>
            </CardContent>
        </Card>
    )
}

function QueueListSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
