import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type MenuItem } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

type Props = {
    item: MenuItem;
    slug: string;
};

export function MenuItemDetail({ item, slug }: Props) {
    const [selectedSpiceLevel, setSelectedSpiceLevel] = useState(
        item.spiceLevels?.[0]
    );

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Image Header */}
            <div className="relative h-80 bg-orange-50">
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-background/80 backdrop-blur-sm"
                        asChild
                    >
                        <Link to={`/$menu/menu`} params={{ menu: slug }}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 backdrop-blur-sm"
                        >
                            <Heart className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 backdrop-blur-sm"
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted-foreground/20 font-serif">
                    {item.name[0]}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-6">
                {/* Title & Price */}
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-3xl font-bold leading-tight flex-1">
                            {item.name}
                        </h1>
                        <span className="text-2xl font-bold text-orange-600 shrink-0">
                            ${item.price.toFixed(2)}
                        </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                        {item.allergens && (
                            <span className="block mt-2 text-sm font-semibold text-foreground">
                                {item.allergens[0]}
                            </span>
                        )}
                    </p>
                </div>

                {/* Spice Level */}
                {item.spiceLevels && item.spiceLevels.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold">Spice Level</h3>
                        <div className="flex gap-3">
                            {item.spiceLevels.map((level) => (
                                <Button
                                    key={level}
                                    variant={selectedSpiceLevel === level ? 'default' : 'outline'}
                                    onClick={() => setSelectedSpiceLevel(level)}
                                    className={cn(
                                        'flex-1 rounded-full',
                                        selectedSpiceLevel === level &&
                                        'bg-orange-600 hover:bg-orange-700'
                                    )}
                                >
                                    {level}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className={cn(
                                    'text-xs',
                                    tag === 'VEGAN' && 'bg-green-100 text-green-700',
                                    tag === 'GLUTEN-FREE' && 'bg-blue-100 text-blue-700',
                                    tag === 'VEGETARIAN' && 'bg-purple-100 text-purple-700',
                                    tag === 'SPICY' && 'bg-red-100 text-red-700',
                                    tag === 'POPULAR' && 'bg-orange-100 text-orange-700'
                                )}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
