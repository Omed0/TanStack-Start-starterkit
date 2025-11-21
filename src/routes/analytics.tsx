import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsManager } from "@/components/analytics/analytics-manager";

export const Route = createFileRoute("/analytics")({
	component: AnalyticsRoute,
});

function AnalyticsRoute() {
	return (
		<div className="container mx-auto p-6">
			<AnalyticsManager />
		</div>
	);
}
