"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Globe } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { countryService, Country, CountryFormData } from "@/lib/api/services/country.service";

const countrySchema = z.object({
    name: z.string().min(1, "Country name is required.").max(255, "Name must be less than 255 characters."),
});

export function CountriesList() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<CountryFormData>({
        resolver: zodResolver(countrySchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            setLoading(true);
            const data = await countryService.getAll();
            setCountries(data);
        } catch (error) {
            console.error("Failed to fetch countries", error);
            alert("Failed to load countries.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (country?: Country) => {
        if (country) {
            setEditingCountry(country);
            form.reset({ name: country.name });
        } else {
            setEditingCountry(null);
            form.reset({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingCountry(null);
        form.reset();
    };

    const onSubmit = async (data: CountryFormData) => {
        try {
            if (editingCountry) {
                await countryService.update(editingCountry.id, data);
                alert("Country updated successfully.");
            } else {
                await countryService.create(data);
                alert("Country added successfully.");
            }
            handleCloseDialog();
            fetchCountries();
        } catch (error: any) {
            console.error("Failed to save country", error);
            const errorMessage = error.response?.data?.message || "Failed to save country.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this country?")) {
            return;
        }

        try {
            await countryService.delete(id);
            alert("Country deleted successfully.");
            const newTotalPages = Math.ceil((countries.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchCountries();
        } catch (error: any) {
            console.error("Failed to delete country", error);
            const errorMessage = error.response?.data?.message || "Failed to delete country.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Countries</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage country options for customer forms.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Country
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCountry ? "Edit Country" : "Add Country"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCountry
                                    ? "Update the country name."
                                    : "Add a new country to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="United States" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseDialog}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingCountry ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : countries.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No countries yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first country to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {countries
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((country) => (
                                        <TableRow key={country.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <Globe className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{country.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(country)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(country.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(countries.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={countries.length}
                    />
                </>
            )}
        </div>
    );
}

