import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
	AuthLoading, UserButton,
	SignedIn, SignedOut,
} from "@daveyplate/better-auth-ui";

export default function UserMenu() {
	//const navigate = useNavigate();
	//const { data: session } = useStore(authClient.useSession);

	return (
		<>

			<AuthLoading>
				<Skeleton className="size-8 rounded-full" />
			</AuthLoading>

			<SignedOut>

				<Button variant="outline" asChild>
					<Link
						to={"/auth/$authView"}
						params={{ authView: "sign-in" }}
					>
						Sign In
					</Link>
				</Button>
			</SignedOut>


			<SignedIn>
				<UserButton
					size="icon"
					classNames={{ base: "cursor-pointer", content: { base: "me-2" } }}
				/>
			</SignedIn>
		</>
	)
}
