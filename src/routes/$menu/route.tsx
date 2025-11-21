import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/$menu')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <main>
            <Outlet />
        </main>
    )
}
