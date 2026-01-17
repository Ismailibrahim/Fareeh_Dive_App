"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { equipmentService, EquipmentFormData, Equipment } from "@/lib/api/services/equipment.service";
import { categoryService, Category } from "@/lib/api/services/category.service";
import { useCreateEquipment, useUpdateEquipment } from "@/lib/hooks/use-equipment";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Tag, X, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const equipmentSchema = z.object({
    name: z.string().min(2, "Equipment name must be at least 2 characters."),
    category: z.string().optional(),
    sizes: z.array(z.string()).optional(),
    brands: z.array(z.string()).optional(),
});

interface EquipmentFormProps {
    initialData?: Equipment;
    equipmentId?: string | number;
}

export function EquipmentForm({ initialData, equipmentId }: EquipmentFormProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const [sizeInput, setSizeInput] = useState("");
    const [brandInput, setBrandInput] = useState("");

    // Use React Query hooks for mutations
    const createMutation = useCreateEquipment();
    const updateMutation = useUpdateEquipment();
    const loading = createMutation.isPending || updateMutation.isPending;

    const form = useForm<EquipmentFormData>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: {
            name: initialData?.name || "",
            category: initialData?.category || "",
            sizes: initialData?.sizes || [],
            brands: initialData?.brands || [],
        },
    });

    const sizes = form.watch("sizes") || [];
    const brands = form.watch("brands") || [];

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const data = await categoryService.getAll();
                // Sort categories by name in ascending order
                const sortedCategories = Array.isArray(data) 
                    ? [...data].sort((a, b) => a.name.localeCompare(b.name))
                    : data;
                setCategories(sortedCategories);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleAddSize = () => {
        const trimmedSize = sizeInput.trim();
        if (trimmedSize && !sizes.includes(trimmedSize)) {
            form.setValue("sizes", [...sizes, trimmedSize]);
            setSizeInput("");
        }
    };

    const handleRemoveSize = (sizeToRemove: string) => {
        form.setValue("sizes", sizes.filter((size) => size !== sizeToRemove));
    };

    const handleSizeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddSize();
        }
    };

    const handleAddBrand = () => {
        const trimmedBrand = brandInput.trim();
        if (trimmedBrand && !brands.includes(trimmedBrand)) {
            form.setValue("brands", [...brands, trimmedBrand]);
            setBrandInput("");
        }
    };

    const handleRemoveBrand = (brandToRemove: string) => {
        form.setValue("brands", brands.filter((brand) => brand !== brandToRemove));
    };

    const handleBrandInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddBrand();
        }
    };

    async function onSubmit(data: EquipmentFormData) {
        try {
            if (equipmentId) {
                await updateMutation.mutateAsync({ id: Number(equipmentId), data });
            } else {
                await createMutation.mutateAsync(data);
            }
            router.push("/dashboard/equipment");
            router.refresh();
        } catch (error) {
            console.error("Failed to save equipment", error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Equipment Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Equipment Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about the equipment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipment Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g. BCD, Regulator, Wetsuit" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={categoriesLoading || categories.length === 0}>
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder={
                                                        categoriesLoading 
                                                            ? "Loading categories..." 
                                                            : categories.length === 0 
                                                                ? "No categories available. Add in Settings."
                                                                : "Select category"
                                                    } />
                                                </SelectTrigger>
                                                {categories.length > 0 && (
                                                    <SelectContent>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.name}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                )}
                                            </Select>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sizes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Available Sizes</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <Input
                                                    placeholder="Type size and press Enter (e.g., XS, S, M, L, XL)"
                                                    className="pl-9"
                                                    value={sizeInput}
                                                    onChange={(e) => setSizeInput(e.target.value)}
                                                    onKeyDown={handleSizeInputKeyDown}
                                                    onBlur={handleAddSize}
                                                />
                                            </div>
                                            {sizes.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {sizes.map((size) => (
                                                        <Badge
                                                            key={size}
                                                            variant="secondary"
                                                            className="flex items-center gap-1 px-2 py-1"
                                                        >
                                                            {size}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSize(size)}
                                                                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                                                                aria-label={`Remove ${size}`}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        Add sizes available for this equipment. These will appear in the size dropdown when creating equipment items.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="brands"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Available Brands</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <Input
                                                    placeholder="Type brand and press Enter (e.g., Scubapro, Aqualung, Cressi)"
                                                    className="pl-9"
                                                    value={brandInput}
                                                    onChange={(e) => setBrandInput(e.target.value)}
                                                    onKeyDown={handleBrandInputKeyDown}
                                                    onBlur={handleAddBrand}
                                                />
                                            </div>
                                            {brands.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {brands.map((brand) => (
                                                        <Badge
                                                            key={brand}
                                                            variant="secondary"
                                                            className="flex items-center gap-1 px-2 py-1"
                                                        >
                                                            {brand}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveBrand(brand)}
                                                                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                                                                aria-label={`Remove ${brand}`}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        Add brands available for this equipment. These will appear in the brand dropdown when creating equipment items.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (equipmentId ? "Update Equipment" : "Create Equipment")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

