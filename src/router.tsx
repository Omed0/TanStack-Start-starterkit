import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { getContext } from "@/lib/tanstack-utils/contexts";
import { routeTree } from "@/routeTree.gen";
import Loader from "@/components/loader";
import "@/index.css";


export function getRouter() {
	const rqContexts = getContext();
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		context: { ...rqContexts },
		defaultPreloadStaleTime: 0, // default is 0 means always refetch on mount
		defaultPreload: "intent", // like nextjs preload on hover Links Component
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <div>Not Found</div>,
		//Wrap: ({ children }) => ( // u dont need add ProviderQueryClient here anymore because of setupRouterSsrQueryIntegration with wrapQueryClient: true do it for us, but if u have more providers u can add them here
		//	<>
		//		{children}
		//	</>
		//),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContexts.queryClient,
		handleRedirects: true,
		// Wrap QueryClient to support SSR properly mean we dont need wrap on tanstack createRouter provider, and configure hydration and de-hyration automatically for us
		wrapQueryClient: true,
	});

	return router;
}


declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
