 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Users, Eye } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: "events" | "users" | "pageviews" | "sessions";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconMap = {
  events: Activity,
  users: Users,
  pageviews: Eye,
  sessions: TrendingUp,
};

export function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {trend && (
          <p
            className={`text-xs ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsMetricsProps {
  metrics: {
    totalEvents: number;
    totalUsers: number;
    totalPageviews: number;
    totalSessions: number;
  };
}

export function AnalyticsMetrics({ metrics }: AnalyticsMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Events"
        value={metrics.totalEvents}
        icon="events"
      />
      <MetricCard
        title="Unique Users"
        value={metrics.totalUsers}
        icon="users"
      />
      <MetricCard
        title="Pageviews"
        value={metrics.totalPageviews}
        icon="pageviews"
      />
      <MetricCard
        title="Sessions"
        value={metrics.totalSessions}
        icon="sessions"
      />
    </div>
  );
}
