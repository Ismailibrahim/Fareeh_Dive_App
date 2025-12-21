"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { customerService, CustomerFormData } from "@/lib/api/services/customer.service";
import { nationalityService, Nationality } from "@/lib/api/services/nationality.service";
import { countryService, Country } from "@/lib/api/services/country.service";
import { Plus, Flag, Globe } from "lucide-react";
import { useEffect } from "react";

const customerSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    // Handle empty string or valid email
    email: z.string().email().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
    passport_no: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.string().optional(),
    date_of_birth: z.string().optional(),
});

interface CustomerDialogProps {
    onSuccess: () => void;
}

export function CustomerDialog({ onSuccess }: CustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nationalities, setNationalities] = useState<Nationality[]>([]);
    const [loadingNationalities, setLoadingNationalities] = useState(true);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    useEffect(() => {
        const fetchNationalities = async () => {
            try {
                const data = await nationalityService.getAll();
                setNationalities(data);
            } catch (error) {
                console.error("Failed to fetch nationalities", error);
            } finally {
                setLoadingNationalities(false);
            }
        };
        fetchNationalities();
    }, []);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await countryService.getAll();
                setCountries(data);
            } catch (error) {
                console.error("Failed to fetch countries", error);
            } finally {
                setLoadingCountries(false);
            }
        };
        fetchCountries();
    }, []);

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            full_name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            zip_code: "",
            country: "",
            passport_no: "",
            nationality: "",
            gender: "",
            date_of_birth: "",
        },
    });

    async function onSubmit(data: CustomerFormData) {
        setLoading(true);
        try {
            await customerService.create(data);
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error) {
            console.error("Failed to create customer", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Customer</DialogTitle>
                    <DialogDescription>
                        Create a new customer profile.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 234..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="passport_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Passport No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="A1234567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nationality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nationality</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                            disabled={loadingNationalities || nationalities.length === 0}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <Flag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder={
                                                            loadingNationalities 
                                                                ? "Loading..." 
                                                                : nationalities.length === 0 
                                                                ? "No nationalities available" 
                                                                : "Select nationality"
                                                        } />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            {nationalities.length > 0 && (
                                                <SelectContent>
                                                    {nationalities.map((nationality) => (
                                                        <SelectItem key={nationality.id} value={nationality.name}>
                                                            {nationality.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            )}
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date_of_birth"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Pick a date"
                                                maxDate={new Date().toISOString().split('T')[0]}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main Street" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="New York" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="zip_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zip Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value}
                                        disabled={loadingCountries || countries.length === 0}
                                    >
                                        <FormControl>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder={
                                                        loadingCountries 
                                                            ? "Loading..." 
                                                            : countries.length === 0 
                                                            ? "No countries available" 
                                                            : "Select country"
                                                    } />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        {countries.length > 0 && (
                                            <SelectContent>
                                                {countries.map((country) => (
                                                    <SelectItem key={country.id} value={country.name}>
                                                        {country.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        )}
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
