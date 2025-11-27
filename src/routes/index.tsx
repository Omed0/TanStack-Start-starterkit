import { createServerFn, useServerFn } from "@tanstack/react-start";
import { dbMiddleware } from "@/lib/tanstack-utils/middlewares";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Bug, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

const checkDB = createServerFn({ method: "GET" })
	.middleware([dbMiddleware])
	.handler(async ({ context }) => {
		const { db } = context
		try {
			await db.$connect()
			return { success: true }
		} catch (error) {
			await db.$disconnect()
			return { success: false }
		} finally {
			await db.$disconnect()
		}
	})

export const Route = createFileRoute("/")({
	component: HomeComponent,
});


const TITLE_TEXT = `
 ████████╗ █████╗ ███╗   ██╗███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝██╔══██╗████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║   ███████║██╔██╗ ██║███████╗   ██║   ███████║██║     █████╔╝ 
    ██║   ██╔══██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║     ██╔═██╗ 
    ██║   ██║  ██║██║ ╚████║███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
                                                                       
 ███████╗████████╗ █████╗ ██████╗ ████████╗
 ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
 ███████╗   ██║   ███████║██████╔╝   ██║   
 ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   
 ███████║   ██║   ██║  ██║██║  ██║   ██║   
 ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
                                            
 ███████╗████████╗ █████╗ ██████╗ ████████╗███████╗██████╗ ██╗  ██╗██╗████████╗
 ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║ ██╔╝██║╚══██╔══╝
 ███████╗   ██║   ███████║██████╔╝   ██║   █████╗  ██████╔╝█████╔╝ ██║   ██║   
 ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██╔══╝  ██╔══██╗██╔═██╗ ██║   ██║   
 ███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗██║  ██║██║  ██╗██║   ██║   
 ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   
 `;


function HomeComponent() {
	const { t } = useTranslation()
	const $fn = useServerFn(checkDB)
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["checkDB"],
		queryFn: $fn
	})

	if (isError) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-2">
				<h2 className="mb-2 font-medium">{t("home.apiStatus")}</h2>
				<p className="text-red-500">{error.message}</p>
			</div>
		)
	}

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto text-sm">{TITLE_TEXT}</pre>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-5 font-medium">{t("home.apiStatus")}</h2>
					{isLoading ? (
						<Skeleton className="h-6 w-24" />
					) : (
						<div className="flex gap-4 items-center">
							{data?.success ? (
								<Circle className="fill-green-500 size-5" />
							) : (
								<Bug className="fill-red-500 size-5" />
							)}
							<p>
								{data?.success ? t("home.connected") :
									t("home.disconnected")}
							</p>
						</div>
					)}
				</section>
			</div>
		</div >
	);
}
