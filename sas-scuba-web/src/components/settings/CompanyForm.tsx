"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, User, MapPin, Globe, Phone, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiveCenter, useUpdateDiveCenter } from "@/lib/hooks/use-dive-center";

const companyFormSchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters."),
    legal_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().min(1, "Please select a country."),
    timezone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export function CompanyForm() {
    const { data: diveCenter, isLoading, error } = useDiveCenter();
    const updateMutation = useUpdateDiveCenter();

    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companyFormSchema),
        defaultValues: {
            name: "",
            legal_name: "",
            email: "",
            phone: "",
            website: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            country: "",
            timezone: "",
        },
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (diveCenter) {
            form.reset({
                name: diveCenter.name,
                legal_name: diveCenter.legal_name || "",
                email: diveCenter.email || "",
                phone: diveCenter.phone || "",
                website: diveCenter.website || "",
                address: diveCenter.address || "",
                city: diveCenter.city || "",
                state: diveCenter.state || "",
                zip: diveCenter.zip || "",
                country: diveCenter.country || "",
                timezone: diveCenter.timezone || diveCenter.settings?.timezone || "",
            });
        }
    }, [diveCenter, form]);

    async function onSubmit(data: CompanyFormValues) {
        try {
            await updateMutation.mutateAsync(data);
        } catch (error: any) {
            console.error("Failed to update settings", error);
            // Error handling is done by the mutation
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-24" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-24" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-24" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert className="border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load dive center settings. Please try refreshing the page.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Company Profile</h3>
                    <p className="text-sm text-muted-foreground">Manage your dive center's public information and contact details.</p>
                </div>
            </div>

            {updateMutation.isSuccess && (
                <Alert className="border-green-500 text-green-500 bg-green-50 dark:bg-green-900/10">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>Settings updated successfully.</AlertDescription>
                </Alert>
            )}

            {updateMutation.isError && (
                <Alert className="border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {updateMutation.error instanceof Error
                            ? updateMutation.error.message
                            : "Failed to update settings. Please try again."}
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Identity Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <User className="h-4 w-4" /> Identity
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Blue Ocean Divers" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="legal_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Legal Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Blue Ocean Pvt Ltd" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Phone className="h-4 w-4" /> Contact
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contact@example.com" {...field} />
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
                                            <Input placeholder="+960 123 4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Location Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <MapPin className="h-4 w-4" /> Location
                        </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Street address, building, floor..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="City" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State / Atoll</FormLabel>
                                        <FormControl>
                                            <Input placeholder="State" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="zip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zip / Postcode</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12345" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Maldives">Maldives</SelectItem>
                                                <SelectItem value="Thailand">Thailand</SelectItem>
                                                <SelectItem value="Egypt">Egypt</SelectItem>
                                                <SelectItem value="Indonesia">Indonesia</SelectItem>
                                                <SelectItem value="Mexico">Mexico</SelectItem>
                                                <SelectItem value="Philippines">Philippines</SelectItem>
                                                <SelectItem value="USA">USA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Regional Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Globe className="h-4 w-4" /> Regional
                        </div>
                        <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Timezone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="UTC+5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button 
                            type="submit" 
                            size="lg"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
