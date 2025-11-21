import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod/v3";

export const Route = createFileRoute("/success")({
	component: SuccessPage,
	validateSearch: (search) => ({
		type: z.enum(["payment_success", "other_success"]).optional().parse(search.type),
		message: z.string().parse(search.message),
		about: z.string().parse(search.about),
		...(search.type === "payment_success" && {
			checkout_id: z.string().parse(search.checkout_id)
		}),
	}),
});

function SuccessPage() {
	const search = useSearch({ from: "/success" });
	const { type, message, about } = search;
	const checkout_id = 'checkout_id' in search ? search.checkout_id : undefined;

	return (
		<div className="container mx-auto px-4 py-8">
			{type == "other_success" ? (
				<Card className="border-green-500">
					<CardHeader>
						<h1 className="text-2xl font-bold">
							{about}
						</h1>
					</CardHeader>
					<CardContent>
						<p className="text-md font-medium">{message}</p>
					</CardContent>
				</Card>
			) : (
				<Card className="border-green-500">
					<CardHeader>
						<h1 className="text-2xl font-bold">
							{about}
						</h1>
					</CardHeader>
					<CardContent>
						<p className="text-md font-medium">
							Checkout ID: {checkout_id}
						</p>
					</CardContent>
				</Card>
			)
			}
		</div >
	);
}
