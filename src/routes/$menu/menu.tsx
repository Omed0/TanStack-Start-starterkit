import { MenuContent } from '@/components/restaurant/menu-content';
import { createFileRoute, redirect } from '@tanstack/react-router'
import { MOCK_RESTAURANTS } from '@/lib/mock-data';

export const Route = createFileRoute('/$menu/menu')({
    loader: async ({ params }) => {
        const restaurant = MOCK_RESTAURANTS.find((r) => r.slug === params.menu);
        if (!restaurant) {
            throw redirect({ to: "/" });
        }
        return { restaurant };
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { menu } = Route.useParams();

    return (
        <MenuContent slug={menu} />
    );
}