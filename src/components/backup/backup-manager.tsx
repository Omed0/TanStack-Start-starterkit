
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import {
    Database,
    Play,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    Trash2,
    Calendar,
    HardDrive,
    Download,
    Archive,
} from "lucide-react";
import { api } from "@/fn";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router"
import { sleep } from "@/lib/utils";

export default function BackupManager() {
    const [cronPattern, setCronPattern] = useState("0 2 * * *");
    const [retentionDays, setRetentionDays] = useState(30);
    const [maxBackupsToKeep, setMaxBackupsToKeep] = useState<number | undefined>(3);
    const [useCountBasedRetention, setUseCountBasedRetention] = useState(true);
    const router = useRouter()
    // Fetch data
    const recentJobs = useQuery({
        ...api.backup.getRecentBackupJobs.queryOptions({ data: { limit: 10 } }),
        refetchInterval: 5000, // Refresh every 5 seconds
    });

    const scheduledBackups = useQuery({
        ...api.backup.getScheduledBackups.queryOptions(),
        refetchInterval: 10000,
    });

    const stats = useQuery({
        ...api.backup.getBackupStats.queryOptions(),
        refetchInterval: 5000,
    });

    const backupList = useQuery({
        ...api.backup.listBackups.queryOptions(),
        refetchInterval: 10000,
    });

    // Mutations
    const triggerBackup = useMutation({
        ...api.backup.triggerManualBackup.mutationOptions(),
        onSuccess: async () => {
            toast.success("Backup job queued - processing will begin shortly");
            // Immediately refetch to show the queued job
            await recentJobs.refetch();
            await stats.refetch();
            // Refetch backup list after a delay to catch completed backups
            setTimeout(() => {
                backupList.refetch();
            }, 2000);
        },
        onError: (error) => {
            toast.error(`Failed to start backup: ${error.message}`);
        },
    });

    const scheduleDaily = useMutation({
        ...api.backup.scheduleDailyBackup.mutationOptions(),
        onSuccess: () => {
            toast.success("Daily backup scheduled at 2 AM");
            scheduledBackups.refetch();
        },
        onError: (error) => {
            toast.error(`Failed to schedule backup: ${error.message}`);
        },
    });

    const scheduleCustom = useMutation({
        ...api.backup.scheduleCustomBackup.mutationOptions(),
        onSuccess: () => {
            toast.success("Custom backup schedule created");
            scheduledBackups.refetch();
        },
        onError: (error) => {
            toast.error(`Failed to schedule backup: ${error.message}`);
        },
    });

    const removeScheduled = useMutation({
        ...api.backup.removeScheduledBackup.mutationOptions(),
        onSuccess: () => {
            toast.success("Scheduled backup removed");
            scheduledBackups.refetch();
        },
    });

    const retryJob = useMutation({
        ...api.backup.retryBackupJob.mutationOptions(),
        onSuccess: () => {
            toast.success("Backup job queued for retry");
            recentJobs.refetch();
        },
    });

    const restoreBackup = useMutation({
        ...api.backup.restoreBackupFromStorage.mutationOptions(),
        onSuccess: async (data) => {
            toast.success(`Backup ${data.filename} restored successfully - Redirecting...`);
            // Redirect to dashboard to force full app reload with restored data
            await sleep(1500);
            router.navigate({
                reloadDocument: true,
                replace: true,
                to: "/success",
                search: {
                    type: "other_success",
                    message: `Backup ${data.filename} restored successfully`,
                    about: "Backup Restoration",
                },
            })
        },
        onError: (error) => {
            toast.error(`Failed to restore backup: ${error.message}`);
        },
    });

    const deleteBackup = useMutation({
        ...api.backup.deleteBackupFromStorage.mutationOptions(),
        onSuccess: () => {
            toast.success("Backup deleted successfully");
            backupList.refetch();
        },
        onError: (error) => {
            toast.error(`Failed to delete backup: ${error.message}`);
        },
    });

    const handleTriggerBackup = (type: "full" | "schema-only") => {
        triggerBackup.mutate({
            data: {
                type,
                compress: true,
                retentionDays: useCountBasedRetention ? undefined : retentionDays,
                maxBackupsToKeep: useCountBasedRetention ? maxBackupsToKeep : undefined,
                scheduledBy: "manual",
            }
        });
    };

    const handleScheduleCustom = (e: React.FormEvent) => {
        e.preventDefault();
        scheduleCustom.mutate({
            data: {
                pattern: cronPattern,
                type: "full",
                retentionDays: useCountBasedRetention ? undefined : retentionDays,
                compress: true,
            }
        });
    };

    return (
        <div className="w-full space-y-8">
            {/* Page Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Database className="h-8 w-8" />
                    Database Backup
                </h1>
                <p className="text-muted-foreground">
                    Database backup description
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Active Jobs"
                    value={stats.data?.active || 0}
                    icon={Loader2}
                    loading={stats.isLoading}
                />
                <StatCard
                    title="Waiting"
                    value={stats.data?.waiting || 0}
                    icon={Clock}
                    loading={stats.isLoading}
                />
                <StatCard
                    title="Completed"
                    value={stats.data?.completed || 0}
                    icon={CheckCircle2}
                    loading={stats.isLoading}
                />
                <StatCard
                    title="Failed"
                    value={stats.data?.failed || 0}
                    icon={XCircle}
                    loading={stats.isLoading}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Manual Backup Triggers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Manual Backup
                        </CardTitle>
                        <CardDescription>
                            Trigger a manual backup immediately
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Retention Policy Selection */}
                        <div className="space-y-2">
                            <FieldLabel>Retention Policy</FieldLabel>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useCountBased"
                                    checked={useCountBasedRetention}
                                    onChange={(e) => setUseCountBasedRetention(e.target.checked)}
                                    className="rounded"
                                />
                                <label htmlFor="useCountBased" className="text-sm">
                                    Keep latest N backups
                                </label>
                            </div>
                            {useCountBasedRetention ? (
                                <Input
                                    type="number"
                                    value={maxBackupsToKeep || 3}
                                    onChange={(e) => setMaxBackupsToKeep(Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    placeholder="Number of backups to keep"
                                />
                            ) : (
                                <Input
                                    type="number"
                                    value={retentionDays}
                                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                                    min={1}
                                    max={365}
                                    placeholder="Retention days"
                                />
                            )}
                            <p className="text-xs text-muted-foreground">
                                {useCountBasedRetention
                                    ? `Keep only the ${maxBackupsToKeep || 3} most recent backups`
                                    : `Keep backups for ${retentionDays} days`}
                            </p>
                        </div>

                        <Button
                            onClick={() => handleTriggerBackup("full")}
                            disabled={triggerBackup.isPending}
                            className="w-full"
                        >
                            {triggerBackup.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Starting Backup...
                                </>
                            ) : (
                                <>
                                    <Database className="mr-2 h-4 w-4" />
                                    Full Backup
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleTriggerBackup("schema-only")}
                            disabled={triggerBackup.isPending}
                            variant="outline"
                            className="w-full"
                        >
                            <HardDrive className="mr-2 h-4 w-4" />
                            Schema Only
                        </Button>
                    </CardContent>
                </Card>

                {/* Quick Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Quick Schedule
                        </CardTitle>
                        <CardDescription>
                            Pre-configured backup schedules
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            onClick={() => scheduleDaily.mutate({})}
                            disabled={scheduleDaily.isPending}
                            className="w-full"
                            variant="secondary"
                        >
                            {scheduleDaily.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Clock className="mr-2 h-4 w-4" />
                            )}
                            Daily at 2 AM
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Automatically backs up database every day at 2:00 AM
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Custom Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Custom Schedule</CardTitle>
                    <CardDescription>
                        Create a custom backup schedule using cron syntax
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleScheduleCustom} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="cron">Cron Pattern</FieldLabel>
                                <Input
                                    id="cron"
                                    value={cronPattern}
                                    onChange={(e) => setCronPattern(e.target.value)}
                                    placeholder="0 2 * * *"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Example: "0 2 * * *" = Every day at 2 AM
                                </p>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="retention">Retention (Days)</FieldLabel>
                                <Input
                                    id="retention"
                                    type="number"
                                    value={retentionDays}
                                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                                    min={1}
                                    max={365}
                                    required
                                />
                            </Field>
                        </div>
                        <Button
                            type="submit"
                            disabled={scheduleCustom.isPending}
                            className="w-full md:w-auto"
                        >
                            {scheduleCustom.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Calendar className="mr-2 h-4 w-4" />
                            )}
                            Create Schedule
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Scheduled Backups */}
            <Card>
                <CardHeader>
                    <CardTitle>Scheduled Backups</CardTitle>
                    <CardDescription>
                        Scheduled backups description
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {scheduledBackups.isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : scheduledBackups.data?.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No Scheduled Backups</EmptyTitle>
                                <EmptyDescription>
                                    No scheduled backups description
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="space-y-2">
                            {scheduledBackups.data?.map((schedule) => (
                                <div
                                    key={schedule.key}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{schedule.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Pattern: {schedule.pattern}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Next run: {schedule.next ? new Date(schedule.next).toLocaleString() : 'Not scheduled'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeScheduled.mutate({ data: { key: schedule.key } })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Backup List from MinIO */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Stored Backups
                    </CardTitle>
                    <CardDescription>
                        All backups stored in MinIO storage
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {backupList.isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : backupList.data?.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No Backups Found</EmptyTitle>
                                <EmptyDescription>
                                    Create your first backup to get started
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="space-y-2">
                            {backupList.data?.map((backup) => (
                                <BackupItem
                                    key={backup.name}
                                    backup={backup}
                                    onRestore={() =>
                                        restoreBackup.mutate({ data: { objectName: backup.name } })
                                    }
                                    onDelete={() =>
                                        deleteBackup.mutate({ data: { objectName: backup.name } })
                                    }
                                    isRestoring={restoreBackup.isPending}
                                    isDeleting={deleteBackup.isPending}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Backup Jobs</CardTitle>
                    <CardDescription>
                        Status and history of backup operations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentJobs.isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : recentJobs.data?.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No backup jobs yet</EmptyTitle>
                                <EmptyDescription>
                                    Trigger a manual backup or create a schedule to get started
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <div className="space-y-2">
                            {recentJobs.data?.map((job) => (
                                <JobItem key={job.id} job={job} onRetry={retryJob.mutate} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    loading,
}: {
    title: string;
    value: number;
    icon: any;
    loading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    );
}

function JobItem({ job, onRetry }: { job: any; onRetry: (data: any) => void }) {
    const getStateColor = (state: string) => {
        switch (state) {
            case "completed":
                return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
            case "failed":
                return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
            case "active":
                return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
            default:
                return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
        }
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium">Backup #{job.id}</p>
                    <Badge variant="secondary" className={getStateColor(job.state)}>
                        {job.state}
                    </Badge>
                    {job.progress > 0 && job.progress < 100 && (
                        <span className="text-sm text-muted-foreground">{job.progress}%</span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Type: {job.data?.type || "full"} | Retention: {job.data?.retentionDays || 30} days
                </p>
                <p className="text-xs text-muted-foreground">
                    {new Date(job.timestamp).toLocaleString()}
                </p>
                {job.failedReason && (
                    <p className="text-xs text-red-600">{job.failedReason}</p>
                )}
            </div>
            {job.state === "failed" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetry({ jobId: job.id })}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            )}
        </div>
    );
}

function BackupItem({
    backup,
    onRestore,
    onDelete,
    isRestoring,
    isDeleting,
}: {
    backup: any;
    onRestore: () => void;
    onDelete: () => void;
    isRestoring: boolean;
    isDeleting: boolean;
}) {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{backup.filename}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Size: {formatBytes(backup.size)}</span>
                    <span>•</span>
                    <span>{formatDate(backup.lastModified)}</span>
                </div>
                {backup.etag && (
                    <p className="text-xs text-muted-foreground font-mono">
                        ETag: {backup.etag}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRestore}
                    disabled={isRestoring || isDeleting}
                >
                    {isRestoring ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Restoring...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Restore
                        </>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isRestoring || isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
