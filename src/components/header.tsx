import { Link } from "@tanstack/react-router";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
		{ to: "/todos", label: "Todos" },
		{ to: "/queues", label: "Queues" },
		{ to: "/backup", label: "Backup" },
		{ to: "/analytics", label: "Analytics" },
		{ to: "/files", label: "Files" },
		{ to: "/ai", label: "AI Chat" },
		{ to: "/$menu", label: "The Golden Spoon", param: "the-golden-spoon" as const },
	];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map((route) => {
						return (
							<Link key={route.to} to={route.to} params={route.param ? { menu: route.param } : undefined}>
								{route.label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
