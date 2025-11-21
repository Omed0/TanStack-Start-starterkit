import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_MENU_ITEMS } from '@/lib/mock-data';
import { ArrowLeft, ChevronDown, Plus, Star, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';

type ItemFeedback = {
    itemId: string;
    rating: number;
};

type Props = {
    slug: string;
};

export function FeedbackForm({ slug }: Props) {
    const [overallRating, setOverallRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [itemFeedbacks, setItemFeedbacks] = useState<ItemFeedback[]>([]);
    const [isItemSectionOpen, setIsItemSectionOpen] = useState(false);

    const handleStarClick = (rating: number) => {
        setOverallRating(rating);
    };

    const handleItemRating = (itemId: string, rating: number) => {
        setItemFeedbacks((prev) => {
            const existing = prev.find((f) => f.itemId === itemId);
            if (existing) {
                return prev.map((f) =>
                    f.itemId === itemId ? { ...f, rating } : f
                );
            }
            return [...prev, { itemId, rating }];
        });
    };

    const addItemFeedback = () => {
        const newItem: ItemFeedback = {
            itemId: '',
            rating: 0,
        };
        setItemFeedbacks([...itemFeedbacks, newItem]);
    };

    const removeItemFeedback = (index: number) => {
        setItemFeedbacks(itemFeedbacks.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-orange-50/30 pb-6">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/$menu/menu`} params={{ menu: slug }}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">Share Your Feedback</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Overall Rating */}
                <div className="bg-background rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-bold">Rate your overall experience</h2>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleStarClick(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-12 w-12 ${star <= overallRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'fill-gray-300 text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback Text */}
                <div className="bg-background rounded-lg p-6 space-y-4">
                    <Label htmlFor="feedback" className="text-base font-semibold">
                        Tell us more about your visit
                    </Label>
                    <Textarea
                        id="feedback"
                        placeholder="What did you like? What could be improved?"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-32 resize-none"
                    />
                </div>

                {/* Item-Specific Feedback */}
                <Collapsible
                    open={isItemSectionOpen}
                    onOpenChange={setIsItemSectionOpen}
                    className="bg-background rounded-lg"
                >
                    <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                        <div className="text-left">
                            <h3 className="font-semibold text-base">
                                Add Item-Specific Feedback
                            </h3>
                            <p className="text-sm text-muted-foreground">(Optional)</p>
                        </div>
                        <ChevronDown
                            className={`h-5 w-5 transition-transform ${isItemSectionOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="px-6 pb-6 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Use the fields below to rate a specific menu item.
                            </p>

                            {itemFeedbacks.map((itemFeedback, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-4 space-y-4 relative"
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={() => removeItemFeedback(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>

                                    <div className="space-y-2">
                                        <Label>Select an item</Label>
                                        <Select
                                            value={itemFeedback.itemId}
                                            onValueChange={(value: any) => {
                                                setItemFeedbacks((prev) =>
                                                    prev.map((f, i) =>
                                                        i === index ? { ...f, itemId: value } : f
                                                    )
                                                );
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a menu item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MOCK_MENU_ITEMS.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Rate this item</Label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() =>
                                                        handleItemRating(itemFeedback.itemId, star)
                                                    }
                                                    className="transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={`h-8 w-8 ${star <= itemFeedback.rating
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'fill-gray-300 text-gray-300'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                onClick={addItemFeedback}
                                className="w-full border-dashed border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Another Item
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Submit Button */}
                <Button
                    size="lg"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 text-base rounded-full"
                >
                    Submit Feedback
                </Button>
            </div>
        </div>
    );
}
