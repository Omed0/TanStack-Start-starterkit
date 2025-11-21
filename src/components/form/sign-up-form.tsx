import { useState, useTransition } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"
import * as z from "zod"

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
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "@tanstack/react-router"

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
	const [loading, setLoading] = useState(false)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()
	const router = useRouter()

	const formSchema = z
		.object({
			firstName: z
				.string()
				.min(2, 'First name must be at least 2 characters long')
				.max(50, 'First name must be at most 50 characters long'),
			lastName: z
				.string()
				.min(2)
				.max(50),
			email: z
				.email(),
			password: z
				.string()
				.min(8)
				.max(100),
			passwordConfirmation: z
				.string()
				.min(1),
			image: z.instanceof(File).nullable(),
		})
		.refine((data) => data.password === data.passwordConfirmation, {
			message: 'Passwords do not match',
			path: ["passwordConfirmation"],
		})

	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			passwordConfirmation: "",
			image: null as File | null,
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email({
				email: value.email,
				password: value.password,
				name: `${value.firstName.trim()} ${value.lastName.trim()}`,
				// image: value.image ? await convertImageToBase64(value.image) : "",
				callbackURL: "/dashboard",
				fetchOptions: {
					onRequest: () => {
						setLoading(true)
					},
					onResponse: () => {
						setLoading(false)
					},
					onSuccess: async () => {
						toast.success('Signup successful')
						router.navigate({ to: "/dashboard" })
					},
					onError: (ctx) => {
						toast.error(ctx.error.message || 'Signup failed')
					},
				},
			})
		},
	})

	const handleImageChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field: any
	) => {
		const file = e.target.files?.[0]
		if (file) {
			field.handleChange(file)
			const reader = new FileReader()
			reader.onloadend = () => {
				setImagePreview(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const clearImage = (field: any) => {
		field.handleChange(null)
		setImagePreview(null)
	}

	const handleChangeToSignIn = () => {
		startTransition(() => {
			onSwitchToSignIn()
		})
	}

	return (
		<Card className="w-md my-10">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
				<CardDescription className="text-xs md:text-sm">
					Sign up for a new account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					id="sign-up-form"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-4">
							<form.Field
								name="firstName"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>First Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Max"
												autoComplete="given-name"
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									)
								}}
							/>
							<form.Field
								name="lastName"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="Robinson"
												autoComplete="family-name"
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									)
								}}
							/>
						</div>
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
										<FieldLabel htmlFor={field.name}>Password</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Password"
											autoComplete="new-password"
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
						<form.Field
							name="passwordConfirmation"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Confirm Password
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Confirm Password"
											autoComplete="new-password"
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
						<form.Field
							name="image"
							children={(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>
										Profile Image
									</FieldLabel>
									<div className="flex items-end gap-4">
										{imagePreview && (
											<div className="relative w-16 h-16 rounded-sm overflow-hidden">
												<img
													src={imagePreview}
													alt="Profile preview"
													className="object-cover"
												/>
											</div>
										)}
										<div className="flex items-center gap-2 w-full">
											<Input
												id={field.name}
												name={field.name}
												type="file"
												accept="image/*"
												onChange={(e) => handleImageChange(e, field)}
												className="w-full"
											/>
											{imagePreview && (
												<X
													className="cursor-pointer"
													onClick={() => clearImage(field)}
												/>
											)}
										</div>
									</div>
									<FieldDescription>
										Upload a profile picture to personalize your account.
									</FieldDescription>
								</Field>
							)}
						/>
						<Button type="submit" className="w-full" disabled={loading || isPending}>
							{loading ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								"Sign Up"
							)}
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter className="border-t justify-center">
				<div onClick={handleChangeToSignIn} className="text-center">
					<p className=" text-sm text-accent-foreground/50 underline hover:text-primary/85">Have an account? Sign In</p>
				</div>
			</CardFooter>
		</Card>
	)
}

