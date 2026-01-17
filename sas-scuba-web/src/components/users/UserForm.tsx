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
import { userService, UserFormData, User } from "@/lib/api/services/user.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Mail, Phone, Shield, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const createUserSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    phone: z.string().optional(),
    role: z.enum(['Admin', 'Instructor', 'DiveMaster', 'Agent']),
    active: z.boolean(),
});

const updateUserSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal("")),
    phone: z.string().optional(),
    role: z.enum(['Admin', 'Instructor', 'DiveMaster', 'Agent']),
    active: z.boolean(),
});

// Form values types
type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
type UserFormValues = CreateUserFormValues | UpdateUserFormValues;

interface UserFormProps {
    initialData?: User;
    userId?: string | number;
}

export function UserForm({ initialData, userId }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const schema = userId ? updateUserSchema : createUserSchema;

    const form = useForm<UserFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            full_name: initialData?.full_name || "",
            email: initialData?.email || "",
            password: "",
            phone: initialData?.phone || "",
            role: initialData?.role || 'Instructor',
            active: initialData?.active ?? true,
        },
    });

    async function onSubmit(data: UserFormValues) {
        setLoading(true);
        try {
            // Type guard to ensure password is string for create
            const passwordValue = userId 
                ? (data.password && data.password.length > 0 ? data.password : undefined)
                : (data.password || "");
            
            const payload: UserFormData = {
                full_name: data.full_name,
                email: data.email,
                password: passwordValue as string,
                phone: data.phone || undefined,
                role: data.role,
                active: data.active,
            };

            if (userId) {
                await userService.update(Number(userId), payload);
            } else {
                await userService.create(payload);
            }
            router.push("/dashboard/settings?tab=users");
            router.refresh();
        } catch (error) {
            console.error("Failed to save user", error);
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
                            <UserIcon className="h-5 w-5 text-primary" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about the user.
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
                                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                        </div>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Account Settings
                        </CardTitle>
                        <CardDescription>
                            Configure user role and account status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Instructor">Instructor</SelectItem>
                                            <SelectItem value="DiveMaster">Dive Master</SelectItem>
                                            <SelectItem value="Agent">Agent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {!userId && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" placeholder="Enter password" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {userId && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password (Optional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" placeholder="Leave blank to keep current password" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground">
                                            Only enter a new password if you want to change it.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Active</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Active users can log in and access the system.
                                        </p>
                                    </div>
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
                        {loading ? "Saving..." : (userId ? "Update User" : "Create User")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

