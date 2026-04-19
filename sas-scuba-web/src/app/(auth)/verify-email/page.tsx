"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/lib/api/services/auth.service";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const verifyEmailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    token: z.string().min(1, "Token is required"),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<VerifyEmailFormValues>({
        resolver: zodResolver(verifyEmailSchema),
        defaultValues: {
            email: searchParams.get('email') || "",
            token: searchParams.get('token') || "",
        },
    });

    useEffect(() => {
        const email = searchParams.get('email');
        const token = searchParams.get('token');
        if (email) form.setValue('email', email);
        if (token) form.setValue('token', token);
        
        // Auto-submit if both email and token are present
        if (email && token) {
            onSubmit({ email, token });
        }
    }, [searchParams]);

    async function onSubmit(data: VerifyEmailFormValues) {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await authService.verifyEmail(data.email, data.token);
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            console.error("Verify Email Error:", err);
            const errorMessage = err.response?.data?.message || err.response?.data?.errors?.token?.[0] || "Failed to verify email. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Verify Email</CardTitle>
                    <CardDescription className="text-center">
                        Verify your email address to complete registration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Email Verified</AlertTitle>
                            <AlertDescription>
                                Your email has been verified successfully. Redirecting to login...
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="email"
                                                            placeholder="Enter your email"
                                                            className="pl-9"
                                                            {...field}
                                                            disabled={!!searchParams.get('email')}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {!searchParams.get('token') && (
                                        <FormField
                                            control={form.control}
                                            name="token"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Verification Token</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter verification token"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "Verifying..." : "Verify Email"}
                                    </Button>
                                </form>
                            </Form>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already verified?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
