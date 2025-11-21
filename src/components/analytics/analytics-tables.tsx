 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface TopEvent {
  name: string;
  count: number;
}

interface TopPage {
  url: string;
  views: number;
  uniqueVisitors: number;
}

interface RecentEvent {
  timestamp: string;
  event: string;
  personId: string;
  url: string | null;
  browser: string | null;
  os: string | null;
}

interface BrowserStat {
  browser: string;
  count: number;
  uniqueUsers: number;
}

interface DeviceStat {
  device: string;
  count: number;
  uniqueUsers: number;
}

export function TopEventsTable({ events }: { events: TopEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No events data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <Badge variant="outline">{event.name}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {event.count.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function TopPagesTable({ pages }: { pages: TopPage[] }) {
  if (!pages || pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pages data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Unique Visitors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page, index) => (
              <TableRow key={index}>
                <TableCell className="max-w-md truncate font-medium">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {page.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell className="text-right">
                  {page.views.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {page.uniqueVisitors.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function RecentEventsTable({ events }: { events: RecentEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent events available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>OS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{event.event}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{event.browser || "—"}</TableCell>
                  <TableCell className="text-sm">{event.os || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function BrowserStatsTable({ browsers }: { browsers: BrowserStat[] }) {
  if (!browsers || browsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Browser Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No browser data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = browsers.reduce((acc, b) => acc + b.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Browser</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {browsers.map((browser, index) => {
              const percentage = ((browser.count / total) * 100).toFixed(1);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{browser.browser}</TableCell>
                  <TableCell className="text-right">
                    {browser.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {browser.uniqueUsers.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{percentage}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function DeviceStatsTable({ devices }: { devices: DeviceStat[] }) {
  if (!devices || devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No device data available</p>
        </CardContent>
      </Card>
    );
  }

  const total = devices.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device, index) => {
              const percentage = ((device.count / total) * 100).toFixed(1);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium capitalize">
                    {device.device}
                  </TableCell>
                  <TableCell className="text-right">
                    {device.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {device.uniqueUsers.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{percentage}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
