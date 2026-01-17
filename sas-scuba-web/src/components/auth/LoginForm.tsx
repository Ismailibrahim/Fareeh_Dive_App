"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginCredentials } from "@/types/auth";
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
import { NoSSR } from "./NoSSR";

interface LoginFormProps {
    onSubmit: (data: LoginCredentials) => Promise<void>;
    loading: boolean;
}

const FormSkeleton = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
    </div>
);

function LoginFormContent({ onSubmit, loading }: LoginFormProps) {
    const form = useForm<LoginCredentials>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </Button>
            </form>
        </Form>
    );
}

export function LoginForm(props: LoginFormProps) {
    return (
        <NoSSR fallback={<FormSkeleton />}>
            <LoginFormContent {...props} />
        </NoSSR>
    );
}