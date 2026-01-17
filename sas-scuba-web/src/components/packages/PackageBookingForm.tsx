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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageBookingFormData } from "@/lib/api/services/package-booking.service";
import { packageBookingService } from "@/lib/api/services/package-booking.service";
import { packageService, Package } from "@/lib/api/services/package.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package as PackageIcon, Users, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { PackageBreakdown } from "./PackageBreakdown";

const bookingSchema = z.object({
    package_id: z.string().min(1, "Package is required"),
    customer_id: z.string().min(1, "Customer is required"),
    persons_count: z.string().min(1, "At least 1 person is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional(),
    option_ids: z.array(z.string()).optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED']).optional(),
    notes: z.string().optional(),
});

// Form values type (matches schema)
type PackageBookingFormValues = z.infer<typeof bookingSchema>;

interface PackageBookingFormProps {
    initialData?: any;
    bookingId?: string | number;
}

export function PackageBookingForm({ initialData, bookingId }: PackageBookingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<Package[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const packageData = await packageService.getAll({ is_active: true });
                const packageList = Array.isArray(packageData) ? packageData : (packageData as any).data || [];
                setPackages(packageList);

                const customerData = await customerService.getAll();
                const customerList = Array.isArray(customerData) ? customerData : (customerData as any).data || [];
                setCustomers(customerList);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<PackageBookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            package_id: initialData?.package_id?.toString() || '',
            customer_id: initialData?.customer_id?.toString() || '',
            persons_count: initialData?.persons_count ? String(initialData.persons_count) : '1',
            start_date: initialData?.start_date || '',
            end_date: initialData?.end_date || '',
            option_ids: initialData?.option_ids?.map((id: number) => String(id)) || [],
            status: initialData?.status || 'PENDING',
            notes: initialData?.notes || '',
        },
    });

    const selectedPackageId = form.watch('package_id');
    const personsCount = form.watch('persons_count');
    const startDate = form.watch('start_date');

    // Load package details when selected
    useEffect(() => {
        if (selectedPackageId) {
            const loadPackage = async () => {
                try {
                    const pkg = await packageService.getById(selectedPackageId);
                    setSelectedPackage(pkg);
                    
                    // Load breakdown
                    const breakdownData = await packageService.getBreakdown(Number(selectedPackageId));
                    setBreakdown(breakdownData);
                } catch (error) {
                    console.error("Failed to load package", error);
                }
            };
            loadPackage();
        } else {
            setSelectedPackage(null);
            setBreakdown(null);
        }
    }, [selectedPackageId]);

    // Calculate end date when package and start date change
    useEffect(() => {
        if (selectedPackage && startDate) {
            const start = new Date(startDate);
            const endDate = new Date(start);
            endDate.setDate(start.getDate() + (selectedPackage.days - 1));
            form.setValue('end_date', endDate.toISOString().split('T')[0]);
        }
    }, [selectedPackage, startDate, form]);

    // Calculate price when package, persons, or options change
    useEffect(() => {
        const personsCountNum = parseInt(personsCount) || 0;
        if (selectedPackage && personsCountNum > 0) {
            const calculatePrice = async () => {
                try {
                    const result = await packageService.calculatePrice(selectedPackage.id, {
                        persons: personsCountNum,
                        option_ids: selectedOptions,
                    });
                    setCalculatedPrice(result.total_price);
                } catch (error) {
                    console.error("Failed to calculate price", error);
                }
            };
            calculatePrice();
        } else {
            setCalculatedPrice(null);
        }
    }, [selectedPackage, personsCount, selectedOptions]);

    const handleOptionToggle = (optionId: number) => {
        setSelectedOptions(prev => {
            const newOptions = prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId];
            form.setValue('option_ids', newOptions.map(id => String(id)));
            return newOptions;
        });
    };

    async function onSubmit(data: PackageBookingFormValues) {
        setLoading(true);
        try {
            // Transform form data to API format
            const payload: PackageBookingFormData = {
                package_id: Number(data.package_id),
                customer_id: Number(data.customer_id),
                persons_count: parseInt(data.persons_count) || 1,
                start_date: data.start_date,
                end_date: data.end_date && data.end_date !== "" ? data.end_date : undefined,
                option_ids: data.option_ids ? data.option_ids.map(id => parseInt(id)) : selectedOptions,
                status: data.status,
                notes: data.notes && data.notes !== "" ? data.notes : undefined,
            };

            if (initialData && bookingId) {
                await packageBookingService.update(Number(bookingId), payload);
            } else {
                await packageBookingService.create(payload);
            }
            router.push('/dashboard/package-bookings');
        } catch (error: any) {
            console.error("Failed to save booking", error);
            alert(error.response?.data?.message || "Failed to save booking");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Form */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Booking Details</CardTitle>
                                    <CardDescription>Select package and customer information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="package_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Package</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a package" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {packages.map((pkg) => (
                                                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                                                {pkg.name} ({pkg.package_code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="customer_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Customer</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a customer" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {customers.map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                                {customer.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="persons_count"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Number of Persons</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                        min={1}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="start_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="end_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PENDING">Pending</SelectItem>
                                                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                                        <SelectItem value="PAID">Paid</SelectItem>
                                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Additional notes..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Package Options */}
                            {selectedPackage && selectedPackage.options && selectedPackage.options.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Package Options</CardTitle>
                                        <CardDescription>Select optional add-ons</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {selectedPackage.options
                                            .filter(opt => opt.is_active)
                                            .map((option) => (
                                                <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{option.name}</div>
                                                        {option.description && (
                                                            <div className="text-sm text-muted-foreground">{option.description}</div>
                                                        )}
                                                        <div className="text-sm font-semibold mt-1">${option.price.toFixed(2)} {option.unit && `per ${option.unit}`}</div>
                                                    </div>
                                                    <Checkbox
                                                        checked={selectedOptions.includes(option.id)}
                                                        onCheckedChange={() => handleOptionToggle(option.id)}
                                                    />
                                                </div>
                                            ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            {selectedPackage && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Package Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Package</div>
                                            <div className="font-semibold">{selectedPackage.name}</div>
                                            <div className="text-sm text-muted-foreground">{selectedPackage.package_code}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Nights</div>
                                                <div className="font-medium">{selectedPackage.nights}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Days</div>
                                                <div className="font-medium">{selectedPackage.days}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Total Dives</div>
                                                <div className="font-medium">{selectedPackage.total_dives}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Persons</div>
                                                <div className="font-medium">{personsCount}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {calculatedPrice !== null && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Price Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Base Price ({personsCount} persons)</span>
                                                <span>${(selectedPackage?.price_per_person || 0) * (parseInt(personsCount) || 0)}.00</span>
                                            </div>
                                            {selectedOptions.length > 0 && (
                                                <>
                                                    {selectedPackage?.options
                                                        ?.filter(opt => selectedOptions.includes(opt.id))
                                                        .map(opt => (
                                                            <div key={opt.id} className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">{opt.name}</span>
                                                                <span>${opt.price.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                </>
                                            )}
                                            <div className="border-t pt-2 mt-2">
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total</span>
                                                    <span>${calculatedPrice.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {breakdown && (
                                <PackageBreakdown breakdown={breakdown} />
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !selectedPackage}>
                            {loading ? 'Saving...' : initialData ? 'Update Booking' : 'Create Booking'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

