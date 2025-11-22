

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsMetrics } from "@/components/analytics/analytics-metrics";
import {
    TopEventsTable,
    TopPagesTable,
    RecentEventsTable,
    BrowserStatsTable,
    DeviceStatsTable,
} from "@/components/analytics/analytics-tables";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/fn";

//refetch 10 min interval
const refetchInterval = 10 * 60 * 1000;

export function AnalyticsManager() {
    const [dateRange, setDateRange] = useState<{ days?: number }>({
        days: 30, // Default to last 30 days
    });

    // Fetch overview metrics
    const {
        data: metricsData,
        isLoading: metricsLoading,
        isRefetching: metricsRefetching,
        refetch: refetchMetrics,
    } = useQuery({
        ...api.analytics.getOverviewMetrics.queryOptions({ data: dateRange }),
        refetchInterval,
    });

    // Fetch top events
    const {
        data: eventsData,
        isLoading: eventsLoading,
        isRefetching: eventsRefetching,
        refetch: refetchEvents,
    } = useQuery({
        ...api.analytics.getTopEvents.queryOptions({ data: { ...dateRange, limit: 10 } }),
        refetchInterval,
    });

    // Fetch top pages
    const {
        data: pagesData,
        isLoading: pagesLoading,
        isRefetching: pagesRefetching,
        refetch: refetchPages,
    } = useQuery({
        ...api.analytics.getTopPages.queryOptions({ data: { ...dateRange, limit: 10 } }),
        refetchInterval,
    });

    // Fetch recent events
    const {
        data: recentData,
        isLoading: recentLoading,
        isRefetching: recentRefetching,
        refetch: refetchRecent,
    } = useQuery({
        ...api.analytics.getRecentEvents.queryOptions({ data: { limit: 20 } }),
        refetchInterval,
    });

    // Fetch browser stats
    const {
        data: browsersData,
        isLoading: browsersLoading,
        isRefetching: browsersRefetching,
        refetch: refetchBrowsers,
    } = useQuery({
        ...api.analytics.getBrowserStats.queryOptions({ data: dateRange }),
        refetchInterval,
    });

    // Fetch device stats
    const {
        data: devicesData,
        isLoading: devicesLoading,
        isRefetching: devicesRefetching,
        refetch: refetchDevices,
    } = useQuery({
        ...api.analytics.getDeviceStats.queryOptions({ data: dateRange }),
        refetchInterval,
    });

    const handleRefreshAll = async () => {
        await Promise.all([
            refetchMetrics(),
            refetchEvents(),
            refetchPages(),
            refetchRecent(),
            refetchBrowsers(),
            refetchDevices(),
        ]);
    };

    const isLoading =
        metricsLoading ||
        eventsLoading ||
        pagesLoading ||
        recentLoading ||
        browsersLoading ||
        devicesLoading;

    const isRefetching =
        metricsRefetching ||
        eventsRefetching ||
        pagesRefetching ||
        recentRefetching ||
        browsersRefetching ||
        devicesRefetching;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">
                        Analytics description
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Date Range Selector */}
                    <Select
                        value={dateRange.days?.toString() || "7"}
                        onValueChange={(value) =>
                            setDateRange({ days: parseInt(value) })
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Last 24 Hours</SelectItem>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="14">Last 14 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={handleRefreshAll}
                        disabled={isLoading || isRefetching}
                        variant="outline"
                    //size="sm"
                    >
                        <RefreshCw
                            className={`me-2 size-4 ${isRefetching ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Overview Metrics */}
            {metricsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[120px]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : metricsData ? (
                <AnalyticsMetrics metrics={metricsData} />
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-sm text-muted-foreground">
                            Failed to load analytics data.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Two-column layout for events and pages */}
            <div className="grid gap-6 md:grid-cols-2">
                {eventsLoading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-[120px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[200px]" />
                        </CardContent>
                    </Card>
                ) : eventsData ? (
                    <TopEventsTable events={eventsData.events} />
                ) : null}

                {pagesLoading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-[120px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[200px]" />
                        </CardContent>
                    </Card>
                ) : pagesData ? (
                    <TopPagesTable pages={pagesData.pages} />
                ) : null}
            </div>

            {/* Two-column layout for browser and device stats */}
            <div className="grid gap-6 md:grid-cols-2">
                {browsersLoading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[200px]" />
                        </CardContent>
                    </Card>
                ) : browsersData ? (
                    <BrowserStatsTable browsers={browsersData.browsers} />
                ) : null}

                {devicesLoading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[200px]" />
                        </CardContent>
                    </Card>
                ) : devicesData ? (
                    <DeviceStatsTable devices={devicesData.devices} />
                ) : null}
            </div>

            {/* Recent Events - Full width */}
            {recentLoading ? (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-[150px]" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px]" />
                    </CardContent>
                </Card>
            ) : recentData ? (
                <RecentEventsTable events={recentData.events} />
            ) : null}
        </div>
    );
}
