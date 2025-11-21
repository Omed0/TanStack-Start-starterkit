import { useState, useTransition } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import z from "zod/v4"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { authClient } from "@/lib/auth-client"
import type { ErrorContext } from "better-auth/react"
import { Link, useRouter } from "@tanstack/react-router"

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
	const [loading, setLoading] = useState(false)
	const [isPending, startTransition] = useTransition()
	const router = useRouter()

	const formSchema = z.object({
		email: z.email(),
		password: z
			.string()
			.min(6)
			.max(100),
		rememberMe: z.boolean(),
	})

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
					rememberMe: value.rememberMe,
					callbackURL: "/dashboard",
				},
				{
					onRequest: () => {
						setLoading(true)
					},
					onResponse: () => {
						setLoading(false)
					},
					onError: (context: ErrorContext) => {
						toast.error(
							context.error.message || 'An error occurred during sign in.'
						)
					},
					onSuccess: () => {
						toast.success('Login successful')
						router.navigate({ to: "/dashboard" })
					},
				}
			)
		},
	})

	const handleChangeToSignUp = () => {
		startTransition(() => {
			onSwitchToSignUp()
		})
	}

	return (
		<Card className="w-md">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
				<CardDescription className="text-xs md:text-sm">
					Sign in to your account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					id="sign-in-form"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<FieldGroup>
						<form.Field
							name="email"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="m@example.com"
											autoComplete="email"
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
						<form.Field
							name="password"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<div className="flex items-center">
											<FieldLabel htmlFor={field.name}>Password</FieldLabel>
											<Link
												to={'/login'}
												className="ms-auto inline-block text-sm underline text-card-foreground"
											>
												Forgot Password?
											</Link>
										</div>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="password"
											autoComplete="current-password"
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
						<form.Field
							name="rememberMe"
							children={(field) => (
								<div className="flex items-center gap-2">
									<Checkbox
										id="remember"
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked === true)
										}
									/>
									<FieldLabel htmlFor="remember">Remember Me</FieldLabel>
								</div>
							)}
						/>
						<Button
							type="submit"
							className="w-full cursor-pointer"
							disabled={loading || isPending}
						>
							{loading ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								"Sign In"
							)}
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter className="justify-center border-t">
				<div onClick={handleChangeToSignUp} className="text-center">
					<p className=" text-sm text-accent-foreground/50 underline hover:text-primary/85">No account? Sign Up</p>
				</div>
			</CardFooter>
		</Card>
	)
}