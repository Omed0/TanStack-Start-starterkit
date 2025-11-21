import { useQuery } from "@tanstack/react-query"
import { Activity, Clock, CheckCircle2, XCircle, Pause } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/fn"

export function QueueMetricsOverview() {
    const { data, isLoading } = useQuery({
        ...api.queue.getQueuesStatus.queryOptions(),
        //refetchIntervalInBackground: true,
        refetchInterval: 10000,
    })

    if (isLoading) {
        return <QueueMetricsSkeletons />
    }

    if (!data) {
        return null
    }

    const metrics = [
        {
            label: "Waiting",
            value: data.total.waiting,
            icon: Clock,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            label: "Active",
            value: data.total.active,
            icon: Activity,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/20",
        },
        {
            label: "Completed",
            value: data.total.completed,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
        },
        {
            label: "Failed",
            value: data.total.failed,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-100 dark:bg-red-900/20",
        },
        {
            label: "Delayed",
            value: data.total.delayed,
            icon: Pause,
            color: "text-orange-600",
            bgColor: "bg-orange-100 dark:bg-orange-900/20",
        },
    ]

    return (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                    <Card key={metric.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {metric.label}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                                <Icon className={`h-4 w-4 ${metric.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total across all queues
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </section>
    )
}

function QueueMetricsSkeletons() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
