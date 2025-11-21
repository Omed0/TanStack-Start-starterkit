

import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";


export default function Header(
	{ LeftSideElement }: { LeftSideElement: React.ReactNode }
) {
	const { isPending, data } = authClient.useSession.get();

	const user = data?.user;
	const initials = user?.name.charAt(0) || "U";

	return (
		<header className="w-full sticky top-0 z-50 flex items-center justify-between">
			{/* Mobile sidebar trigger */}
			{LeftSideElement}

			{/* Right side actions - visible on all screen sizes */}
			<div className="flex justify-end text-lg">
				{isPending ? (
					<Skeleton className="h-9 w-20" />
				) : user ? (
					<div className="flex gap-2 items-center">
						<Avatar>
							<AvatarImage
								src={user?.image || undefined}
								alt={user?.name || "User Avatar"}
							/>
							<AvatarFallback>
								{initials}
							</AvatarFallback>
						</Avatar>
						<span>{user?.name.split(" ")[0]}</span>
					</div>
				) : (
					<Link to={"/login"} className={buttonVariants()}>
						Sign In
					</Link>
				)}
			</div>
		</header>
	);
}
