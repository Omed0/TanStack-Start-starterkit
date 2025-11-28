import React from "react";
import {
	createRootRouteWithContext,
	Scripts, useRouter
} from "@tanstack/react-router";
import { Providers } from "@/components/layout/clients-provider";
import type { RqContext } from "@/lib/tanstack-utils/contexts";
import { getUser, type AuthSession } from "@/fn/related-user";
import { HeadContent } from "@tanstack/react-router";
import i18n, { setSSRLanguage } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { Outlet } from "@tanstack/react-router";
import Header from "@/components/layout/header";
import appCss from "@/index.css?url";

const ReactQueryDevtools =
	process.env.NODE_ENV === "production"
		? () => null
		: React.lazy(() =>
			import("@tanstack/react-query-devtools").then((res) => ({
				default: res.ReactQueryDevtools,
			})),
		)

export interface RouterAppContext extends Omit<RqContext, 'session'> {
	session?: AuthSession;
	//customer?: Awaited<ReturnType<typeof getPayment>>;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	beforeLoad: async ({ context }) => {
		context.session ??= await getUser()
		await setSSRLanguage()

		return { session: context.session }
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
				title: i18n.t("seo.title", { defaultValue: "Starter-kit" }),
				description: i18n.t("seo.description", { defaultValue: "Starter-kit" }),
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
			<html lang={i18n.language} suppressHydrationWarning>
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
	const router = useRouter()

	React.useEffect(() => {
		const handler = () => {
			router.invalidate()
		}
		i18n.on("languageChanged", handler)
		return () => {
			i18n.off("languageChanged", handler)
		}
	}, [router]) // this for changeing title and description page when change language if u used title and more thing in head, if not u can remove 
	return (
		<html lang={i18n.language} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="grid h-svh grid-rows-[auto_1fr]">
				<Providers>
					<Header />
					<Outlet />
					<Toaster richColors />
					<React.Suspense fallback={null}>
						<ReactQueryDevtools
							initialIsOpen={false}
							buttonPosition="bottom-left"
							client={queryClient}
						/>
					</React.Suspense>
				</Providers>
				<Scripts />
			</body>
		</html>
	);
}
