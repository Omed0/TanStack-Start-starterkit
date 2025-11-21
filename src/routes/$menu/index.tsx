import { Button } from '@/components/ui/button';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import { createFileRoute, Link } from '@tanstack/react-router'
import { Globe } from 'lucide-react';

export const Route = createFileRoute('/$menu/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { menu } = Route.useParams();

  const restaurant = MOCK_RESTAURANTS.find((r) => r.slug === menu);

  if (!restaurant) {
    return <div>Restaurant not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-linear-to-b from-orange-200/70 to-background">
      <div className="absolute top-6 right-6">
        <Button variant="outline" size="icon" className="rounded-full">
          <Globe className="size-5" />
        </Button>
      </div>

      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-6">
          <div className="mx-auto w-32 h-32 rounded-full bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
            <div className="text-white text-4xl font-serif">
              {restaurant.name[0]}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-gray-400 text-sm tracking-[0.3em] uppercase">
              Restaurant
            </h1>
            <p className="text-gray-400 text-xs tracking-widest">
              V.0 U 0 6 & E L S 0 F E W 0 R K
            </p>
          </div>
        </div>

        <div className="space-y-4 py-8">
          <h2 className="text-4xl font-bold text-foreground">
            Welcome to {restaurant.name}!
          </h2>
          <p className="text-lg text-muted-foreground">
            {restaurant.description}
          </p>
        </div>

        <Button
          asChild
          className="absolute bottom-4 start-1/2 -translate-1/2 w-full max-w-lg bg-orange-600 hover:bg-orange-700 text-white h-14 text-lg rounded-sm"
        >
          <Link
            to="/$menu/menu"
            params={{ menu: restaurant.slug }}
          >
            View Menu
          </Link>
        </Button>
      </div>
    </div>
  );
}