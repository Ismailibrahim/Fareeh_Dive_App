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
import { customerService, CustomerFormData } from "@/lib/api/services/customer.service";
import { nationalityService, Nationality } from "@/lib/api/services/nationality.service";
import { Plus, Flag } from "lucide-react";
import { useEffect } from "react";

const customerSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    // Handle empty string or valid email
    email: z.string().email().or(z.literal("")),
    phone: z.string().optional(),
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

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            full_name: "",
            email: "",
            phone: "",
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
            <DialogContent className="sm:max-w-[425px]">
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
                                    <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
