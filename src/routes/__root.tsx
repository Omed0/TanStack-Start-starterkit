import type { RqContext } from "@/lib/tanstack-utils/contexts";
import { Toaster } from "@/components/ui/sonner";

import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import {
	ReactQueryDevtools
} from "@tanstack/react-query-devtools";
import Header from "@/components/header";
import appCss from "@/index.css?url";
import { getUser, type AuthSession } from "@/fn/related-user";
import { initWorkers } from "@/fn";

export interface RouterAppContext extends Omit<RqContext, 'session'> {
	session?: AuthSession;
	//customer?: Awaited<ReturnType<typeof getPayment>>;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	async context(ctx) {
		ctx.context.session = ctx.context.session ?? await getUser();
		return ctx;
	},
	beforeLoad: async () => {
		try {
			//context.session ??= await getUser();
			//context.customer ??= await getPayment();

			// Initialize BullMQ workers on server startup (non-blocking)
			if (typeof window === "undefined") {
				initWorkers().catch((error) => {
					console.error("Failed to initialize workers:", error);
				});
			}
		} catch (error) {
			console.error("Error in beforeLoad:", error);
		}
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "My App",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootDocument,
	errorComponent: ({ error }) => {
		return (
			<html lang="en" className="dark">
				<head>
					<HeadContent />
				</head>
				<body className="grid h-svh place-items-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
						<p className="mb-4 text-red-500">{error.message}</p>
						<a href="/" className="text-primary underline">Go back home</a>
					</div>
					<Scripts />
				</body>
			</html>
		);
	},
});

function RootDocument() {
	const { queryClient } = Route.useRouteContext()
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="grid h-svh grid-rows-[auto_1fr]">
				<Header />
				<Outlet />
				<Toaster richColors />
				<ReactQueryDevtools
					initialIsOpen={false}
					buttonPosition="bottom-left"
					client={queryClient}
				/>
				<Scripts />
			</body>
		</html>
	);
}
