import { createFileRoute, redirect } from "@tanstack/react-router";
//import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
//import { createServerFn } from "@tanstack/react-start";
//import { auth } from "@/lib/auth";
//import { getRequestHeaders } from "@tanstack/react-start/server";

//const purchasePlanPro = createServerFn({ method: "POST" }).handler(async () => {
//	const res = await auth.api.checkout({
//		body: { slug: "pro" },
//		headers: getRequestHeaders(),
//	})
//	return res
//})

//const listPurchases = createServerFn({ method: "GET" })
//	.handler(async () => {
//		const response = await auth.api.subscriptions({
//			headers: getRequestHeaders(),
//			query: {
//				page: 1,
//				limit: 10,
//				active: true,
//			},
//		});

//		return response?.result.items || [];
//	})

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	loader: async ({ context }) => {

		if (!context.session) {
			throw redirect({
				to: "/login",
			});
		}

		//const listSubscriptions = await listPurchases();

		//return {
		//	listSubscriptions,
		//};
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();


	//const hasProSubscription =
	//	(customer?.activeSubscriptions?.length ?? 0) > 0;
	// For debugging: console.log("Active subscriptions:", customerState?.activeSubscriptions);


	return (
		<div>
			<h1>Welcome to the Dashboard</h1>
			<p>Hello, {session?.user?.name}!</p>
		</div>
	)

	//return (
	//	<div>
	//		<h1>Dashboard</h1>
	//		<p>Welcome {session?.user.name}</p>
	//		<p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
	//		{/*<p>{customerPaymentState.data?.name}</p>*/}
	//		{hasProSubscription ? (
	//			<Card>
	//				<CardHeader>
	//					Manage Subscriptions
	//				</CardHeader>
	//				<CardContent>
	//					<h3>You are currently on the Pro plan. Thank you for your support!</h3>
	//					<CardDescription>
	//						{listSubscriptions && listSubscriptions.length > 0 ? listSubscriptions.map((sub) => (
	//							<div key={sub.id} className="mb-4">
	//								<p>Subscription ID: {sub.id}</p>
	//								<p>Status: {sub.status}</p>
	//								<p>Price ID: {sub.amount}</p>
	//								{sub.currentPeriodEnd && (
	//									<p>Current Period End:
	//										{new Date(+sub.currentPeriodEnd * 1000).toLocaleDateString()}
	//									</p>)
	//								}
	//							</div>
	//						)) : <p>No subscriptions found.</p>}
	//					</CardDescription>
	//				</CardContent>
	//			</Card>
	//		) : (
	//			<Button>
	//				Upgrade to Pro
	//			</Button>
	//		)
	//		}
	//	</div>
	//);
}
