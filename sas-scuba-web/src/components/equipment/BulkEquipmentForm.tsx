"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { equipmentService, EquipmentFormData } from "@/lib/api/services/equipment.service";
import { categoryService, Category } from "@/lib/api/services/category.service";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BulkEquipmentRow {
    id: string;
    name: string;
    category: string;
    sizes: string[];
    brands: string[];
}

interface BulkEquipmentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function BulkEquipmentForm({ onSuccess, onCancel }: BulkEquipmentFormProps) {
    const [rows, setRows] = useState<BulkEquipmentRow[]>([
        { id: "1", name: "", category: "", sizes: [], brands: [] },
    ]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [sizeInputs, setSizeInputs] = useState<Record<string, string>>({});
    const [brandInputs, setBrandInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getAll();
                const sortedCategories = Array.isArray(data)
                    ? [...data].sort((a, b) => a.name.localeCompare(b.name))
                    : data;
                setCategories(sortedCategories);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    const addRow = () => {
        const newId = Date.now().toString();
        setRows([
            ...rows,
            { id: newId, name: "", category: "", sizes: [], brands: [] },
        ]);
        setSizeInputs({ ...sizeInputs, [newId]: "" });
        setBrandInputs({ ...brandInputs, [newId]: "" });
    };

    const removeRow = (id: string) => {
        if (rows.length === 1) return; // Keep at least one row
        setRows(rows.filter((row) => row.id !== id));
        const newSizeInputs = { ...sizeInputs };
        const newBrandInputs = { ...brandInputs };
        delete newSizeInputs[id];
        delete newBrandInputs[id];
        setSizeInputs(newSizeInputs);
        setBrandInputs(newBrandInputs);
    };

    const updateRow = (id: string, field: keyof BulkEquipmentRow, value: any) => {
        setRows(
            rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const handleAddSize = (rowId: string) => {
        const sizeInput = sizeInputs[rowId]?.trim() || "";
        if (sizeInput) {
            const row = rows.find((r) => r.id === rowId);
            if (row && !row.sizes.includes(sizeInput)) {
                updateRow(rowId, "sizes", [...row.sizes, sizeInput]);
                setSizeInputs({ ...sizeInputs, [rowId]: "" });
            }
        }
    };

    const handleRemoveSize = (rowId: string, size: string) => {
        const row = rows.find((r) => r.id === rowId);
        if (row) {
            updateRow(rowId, "sizes", row.sizes.filter((s) => s !== size));
        }
    };

    const handleAddBrand = (rowId: string) => {
        const brandInput = brandInputs[rowId]?.trim() || "";
        if (brandInput) {
            const row = rows.find((r) => r.id === rowId);
            if (row && !row.brands.includes(brandInput)) {
                updateRow(rowId, "brands", [...row.brands, brandInput]);
                setBrandInputs({ ...brandInputs, [rowId]: "" });
            }
        }
    };

    const handleRemoveBrand = (rowId: string, brand: string) => {
        const row = rows.find((r) => r.id === rowId);
        if (row) {
            updateRow(rowId, "brands", row.brands.filter((b) => b !== brand));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Filter out empty rows
        const validRows = rows.filter((row) => row.name.trim().length >= 2);
        
        if (validRows.length === 0) {
            alert("Please add at least one equipment with a valid name (minimum 2 characters)");
            return;
        }

        setLoading(true);
        try {
            const equipmentData: EquipmentFormData[] = validRows.map((row) => ({
                name: row.name.trim(),
                category: row.category || undefined,
                sizes: row.sizes.length > 0 ? row.sizes : undefined,
                brands: row.brands.length > 0 ? row.brands : undefined,
            }));

            const result = await equipmentService.bulkCreate(equipmentData);
            
            if (result.error_count > 0) {
                alert(
                    `Bulk create completed with errors:\n${result.success_count} succeeded\n${result.error_count} failed`
                );
            } else {
                alert(`Successfully created ${result.success_count} equipment items!`);
            }
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Failed to create equipment", error);
            alert(
                error.response?.data?.message ||
                "Failed to create equipment. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Equipment List</CardTitle>
                    <CardDescription>
                        Add multiple equipment items in the table below. Click on cells to edit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead className="min-w-[200px]">
                                            Name <span className="text-destructive">*</span>
                                        </TableHead>
                                        <TableHead className="min-w-[150px]">Category</TableHead>
                                        <TableHead className="min-w-[200px]">Sizes</TableHead>
                                        <TableHead className="min-w-[200px]">Brands</TableHead>
                                        <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row, index) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium text-muted-foreground">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.name}
                                                    onChange={(e) =>
                                                        updateRow(row.id, "name", e.target.value)
                                                    }
                                                    placeholder="e.g. BCD, Regulator"
                                                    className="h-9"
                                                    required
                                                    minLength={2}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={row.category}
                                                    onValueChange={(value) =>
                                                        updateRow(row.id, "category", value)
                                                    }
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.name}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9 w-full justify-start text-left font-normal"
                                                        >
                                                            {row.sizes.length > 0 ? (
                                                                <span className="truncate">
                                                                    {row.sizes.join(", ")}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    Add sizes...
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80" align="start">
                                                        <div className="space-y-3">
                                                            <div className="font-medium text-sm">Sizes</div>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={sizeInputs[row.id] || ""}
                                                                    onChange={(e) =>
                                                                        setSizeInputs({
                                                                            ...sizeInputs,
                                                                            [row.id]: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder="Type size and press Enter"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault();
                                                                            handleAddSize(row.id);
                                                                        }
                                                                    }}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                            {row.sizes.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-2">
                                                                    {row.sizes.map((size) => (
                                                                        <Badge
                                                                            key={size}
                                                                            variant="secondary"
                                                                            className="flex items-center gap-1"
                                                                        >
                                                                            {size}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleRemoveSize(row.id, size)
                                                                                }
                                                                                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9 w-full justify-start text-left font-normal"
                                                        >
                                                            {row.brands.length > 0 ? (
                                                                <span className="truncate">
                                                                    {row.brands.join(", ")}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    Add brands...
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80" align="start">
                                                        <div className="space-y-3">
                                                            <div className="font-medium text-sm">Brands</div>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={brandInputs[row.id] || ""}
                                                                    onChange={(e) =>
                                                                        setBrandInputs({
                                                                            ...brandInputs,
                                                                            [row.id]: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder="Type brand and press Enter"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault();
                                                                            handleAddBrand(row.id);
                                                                        }
                                                                    }}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                            {row.brands.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-2">
                                                                    {row.brands.map((brand) => (
                                                                        <Badge
                                                                            key={brand}
                                                                            variant="secondary"
                                                                            className="flex items-center gap-1"
                                                                        >
                                                                            {brand}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleRemoveBrand(row.id, brand)
                                                                                }
                                                                                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell>
                                                {rows.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRow(row.id)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addRow}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Row
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            {rows.filter((r) => r.name.trim().length >= 2).length} valid equipment
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={loading} size="lg">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        `Create ${rows.filter((r) => r.name.trim().length >= 2).length} Equipment`
                    )}
                </Button>
            </div>
        </form>
    );
}

