import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, type MenuItem } from '@/lib/mock-data';
import { ArrowLeft, ArrowUpDown, ListFilter, Search } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

type Props = {
    slug: string;
};

export function MenuContent({ slug }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0].id);

    const filteredItems = MOCK_MENU_ITEMS.filter((item) => {
        const matchesCategory = item.categoryId === activeCategory;
        const matchesSearch = item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getItemsBySubcategory = () => {
        const grouped: Record<string, MenuItem[]> = {};
        filteredItems.forEach((item) => {
            const subcategory = item.tags[1] || 'Other';
            if (!grouped[subcategory]) {
                grouped[subcategory] = [];
            }
            grouped[subcategory].push(item);
        });
        return grouped;
    };

    const groupedItems = getItemsBySubcategory();

    return (
        <div className="min-h-screen pb-20 bg-background">
            {/* Header */}
            <header className="bg-background">
                <div className="flex items-center justify-between p-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/$menu`} params={{ menu: slug }}>
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">Menu</h1>
                    <div className="w-10" />
                </div>
            </header>

            {/* Tabs */}
            <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
            >
                <div className="sticky top-0 z-30 bg-background border-b">
                    <TabsList className="w-full rounded-none h-auto p-0 bg-transparent">
                        {MOCK_CATEGORIES.map((category) => (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className="rounded-none border-0 font-semibold border-b-2 data-[state=active]:border-orange-600 data-[state=active]:text-orange-600 p-3"
                            >
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Search */}
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search menu items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-muted/50"
                        />
                    </div>
                </div>

                {MOCK_CATEGORIES.map((category) => (
                    <TabsContent key={category.id} value={category.id}>
                        {/* Category Header */}
                        <div className="p-3 flex items-center justify-between border-b">
                            <h2 className="text-xl font-bold">{category.name}</h2>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                    <ListFilter className="size-5" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <ArrowUpDown className="size-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Subcategory Tabs */}
                        <div className="px-5 py-3 flex gap-2 overflow-x-auto">
                            {Object.keys(groupedItems).map((subcategory) => (
                                <Button
                                    key={subcategory}
                                    className="font-semibold rounded-full shrink-0 bg-red-200/50 border-0 hover:bg-red-300/50 text-orange-600"
                                >
                                    {subcategory}
                                </Button>
                            ))}
                        </div>

                        {/* Items List */}
                        <div className="px-4 space-y-2">
                            {Object.entries(groupedItems).map(([subcategory, items]) => (
                                <div key={subcategory} className="space-y-4">
                                    {items.map((item) => (
                                        <Link
                                            key={item.id}
                                            to={`/$menu/$item`}
                                            params={{ menu: slug, item: item.id }}
                                            className="block"
                                        >
                                            <div className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                                                        {item.name[0]}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-start gap-2">
                                                        {item.tags[0] && (
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    'text-xs shrink-0',
                                                                    item.tags[0] === 'VEGAN' &&
                                                                    'bg-green-100 text-green-700',
                                                                    item.tags[0] === 'GLUTEN-FREE' &&
                                                                    'bg-blue-100 text-blue-700',
                                                                    item.tags[0] === 'VEGETARIAN' &&
                                                                    'bg-purple-100 text-purple-700',
                                                                    item.tags[0] === 'SPICY' &&
                                                                    'bg-red-100 text-red-700',
                                                                    item.tags[0] === 'POPULAR' &&
                                                                    'bg-orange-100 text-orange-700'
                                                                )}
                                                            >
                                                                {item.tags[0]}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-semibold text-sm leading-tight">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                    <p className="text-orange-600 font-bold text-sm">
                                                        ${item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
