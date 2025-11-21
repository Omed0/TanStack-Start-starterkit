
import SignInForm from "@/components/form/sign-in-form";
import SignUpForm from "@/components/form/sign-up-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
	component: () => <main className="container mx-auto flex justify-center items-center">
		<RouteComponent />
	</main>,
});

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(true);

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
