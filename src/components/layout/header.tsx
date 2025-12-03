import { Link } from "@tanstack/react-router";
import UserMenu from "@/components/layout/user-menu";
import LanguageToggle from "@/components/layout/language-toggle";
import { ModeToggle } from "@/components/layout/mode-toggle";

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
	];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map((route) => {
						return (
							<Link key={route.to} to={route.to} >
								{route.label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<LanguageToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	)
}
