
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack"
import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack"
import { Link, useRouter } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import type { ReactNode } from "react"
import { ThemeProvider } from "./theme-provider"



export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()

    return (
        <AuthQueryProvider>
            <AuthUIProviderTanstack
                // @ts-expect-error - Type incompatibility between better-auth admin plugin extended types
                // and @daveyplate/better-auth-ui expected types. The client works correctly at runtime.
                authClient={authClient}
                onSessionChange={() => router.invalidate()}
                navigate={(href) => router.navigate({ href })}
                replace={(href) => router.navigate({ href, replace: true })}
                Link={({ href, ...props }) => <Link to={href} {...props} />}
            //persistClient={true}
            //viewPaths={{
            //    SIGN_IN: "login",
            //    SIGN_OUT: "logout",
            //    SIGN_UP: "register",
            //}}
            >
                <ThemeProvider
                    enableSystem
                    attribute="class"
                    defaultTheme="system"
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </AuthUIProviderTanstack>
        </AuthQueryProvider>
    )
}
