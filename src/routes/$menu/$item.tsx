import { MenuItemDetail } from '@/components/restaurant/menu-item-detail';
import { MOCK_MENU_ITEMS, MOCK_RESTAURANTS } from '@/lib/mock-data';
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$menu/$item')({
  loader: async ({ params }) => {
    const { menu: slug, item: id } = params;

    const restaurant = MOCK_RESTAURANTS.find((r) => r.slug === slug);
    const item = MOCK_MENU_ITEMS.find((i) => i.id === id);

    if (!restaurant || !item) {
      throw redirect({ to: "/" });
    }

    return { restaurant, item };
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { menu: slug, item: id } = Route.useParams();


  const item = MOCK_MENU_ITEMS.find((i) => i.id === id)!;

  return <MenuItemDetail item={item} slug={slug} />
}
