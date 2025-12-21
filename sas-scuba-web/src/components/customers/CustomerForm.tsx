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
import { customerService, CustomerFormData, Customer } from "@/lib/api/services/customer.service";
import { nationalityService, Nationality } from "@/lib/api/services/nationality.service";
import { countryService, Country } from "@/lib/api/services/country.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, CreditCard, Flag, MapPin, Globe, Plane } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

const customerSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
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
    departure_date: z.string().optional(),
    departure_flight: z.string().optional(),
    departure_to: z.string().optional(),
});

interface CustomerFormProps {
    initialData?: Customer;
    customerId?: string | number;
}

export function CustomerForm({ initialData, customerId }: CustomerFormProps) {
    const router = useRouter();
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
            full_name: initialData?.full_name || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            city: initialData?.city || "",
            zip_code: initialData?.zip_code || "",
            country: initialData?.country || "",
            passport_no: initialData?.passport_no || "",
            nationality: initialData?.nationality || "",
            gender: initialData?.gender || "",
            date_of_birth: initialData?.date_of_birth || "",
            departure_date: initialData?.departure_date || "",
            departure_flight: initialData?.departure_flight || "",
            departure_to: initialData?.departure_to || "",
        },
    });

    async function onSubmit(data: CustomerFormData) {
        setLoading(true);
        try {
            if (customerId) {
                await customerService.update(customerId, data);
                router.push("/dashboard/customers");
                router.refresh();
            } else {
                const newCustomer = await customerService.create(data);
                router.push(`/dashboard/customers/${newCustomer.id}`);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save customer", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about the customer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="John Doe" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
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
                                                minDate="1900-01-01"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Contact Details
                        </CardTitle>
                        <CardDescription>
                            How can we reach this customer?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="email@example.com" className="pl-9" {...field} />
                                        </div>
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
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="+1 (555) 000-0000" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Address Information
                        </CardTitle>
                        <CardDescription>
                            Customer's residential or mailing address.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="123 Main Street" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </CardContent>
                </Card>

                {/* Identity & Travel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Flag className="h-5 w-5 text-primary" />
                            Identity & Travel
                        </CardTitle>
                        <CardDescription>
                            Passport and nationality information for travel manifests.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="passport_no"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Passport Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="A12345678" className="pl-9" {...field} />
                                        </div>
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
                    </CardContent>
                </Card>

                {/* Departure Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Plane className="h-5 w-5 text-primary" />
                            Departure Information
                        </CardTitle>
                        <CardDescription>
                            Customer's departure details for travel planning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="departure_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Departure Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Pick a date"
                                            minDate={new Date().toISOString().split('T')[0]}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="departure_flight"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Departure Flight</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Plane className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g., AA123" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="departure_to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Departure To</FormLabel>
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
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (customerId ? "Update Customer" : "Create Customer")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
