"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriceSuggestion } from "@/lib/api/services/price-list.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceSuggestionDropdownProps {
    diveCount: number;
    serviceType: string;
    customerId?: number;
    selectedPriceItemId?: number;
    onSelect: (suggestion: PriceSuggestion) => void;
    className?: string;
}

export function PriceSuggestionDropdown({
    diveCount,
    serviceType,
    customerId,
    selectedPriceItemId,
    onSelect,
    className,
}: PriceSuggestionDropdownProps) {
    const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (diveCount > 0 && serviceType) {
            loadSuggestions();
        }
    }, [diveCount, serviceType, customerId]);

    const loadSuggestions = async () => {
        try {
            setLoading(true);
            const data = await priceListItemService.getPriceSuggestions(diveCount, serviceType, customerId);
            setSuggestions(data.suggestions || []);
        } catch (error) {
            console.error('Failed to load price suggestions:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const selectedSuggestion = suggestions.find(s => s.id === selectedPriceItemId);
    const bestSuggestion = suggestions[0]; // First suggestion is the best match

    if (suggestions.length === 0 && !loading) {
        return null;
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-full justify-between", className)}
                    disabled={loading || suggestions.length === 0}
                >
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>
                            {loading
                                ? "Loading suggestions..."
                                : selectedSuggestion
                                ? `${selectedSuggestion.name} - $${Number(selectedSuggestion.price || 0).toFixed(2)}`
                                : bestSuggestion
                                ? `Best: ${bestSuggestion.name} - $${Number(bestSuggestion.price || 0).toFixed(2)}`
                                : "No suggestions"}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
                <DropdownMenuLabel>Price Suggestions ({diveCount} dives)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {suggestions.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        No matching prices found for {diveCount} dives
                    </div>
                ) : (
                    suggestions.map((suggestion) => (
                        <DropdownMenuItem
                            key={suggestion.id}
                            className="flex flex-col items-start gap-2 p-3 cursor-pointer"
                            onClick={() => {
                                onSelect(suggestion);
                                setOpen(false);
                            }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{suggestion.name}</span>
                                    {suggestion.id === selectedPriceItemId && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                                <span className="font-bold text-primary">
                                    ${Number(suggestion.price || 0).toFixed(2)}
                                </span>
                            </div>
                            {suggestion.description && (
                                <p className="text-xs text-muted-foreground">
                                    {suggestion.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline">
                                    {suggestion.pricing_model}
                                </Badge>
                                <Badge variant="outline">
                                    {suggestion.min_dives}-{suggestion.max_dives} dives
                                </Badge>
                                {suggestion.priority > 0 && (
                                    <Badge variant="secondary">
                                        Priority: {suggestion.priority}
                                    </Badge>
                                )}
                                {suggestion.applicable_to !== 'ALL' && (
                                    <Badge variant="outline">
                                        {suggestion.applicable_to}
                                    </Badge>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

