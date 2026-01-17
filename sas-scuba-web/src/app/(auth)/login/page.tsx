"use client";

import { useState, useEffect } from "react";
import { LoginCredentials } from "@/types/auth";
import { authService } from "@/lib/api/services/auth.service";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/LoginForm";

// Disable SSR for this page to prevent hydration errors with browser extensions
export const dynamic = 'force-dynamic';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component only renders form after client-side mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    async function onSubmit(data: LoginCredentials) {
        setLoading(true);
        setError(null);
        try {
            await authService.login(data);
            router.push("/dashboard");
        } catch (err: any) {
            // Handle different error types
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.userMessage) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                setError(
                    err.userMessage || 
                    `Cannot connect to server at ${apiUrl}. Please ensure the backend API server is running.`
                );
            } else if (err.response?.status === 422) {
                // Laravel validation errors
                const errors = err.response?.data?.errors;
                console.error("Validation errors:", errors);
                console.error("Full error response:", err.response?.data);
                
                if (errors) {
                    // Get the first error message
                    const firstErrorKey = Object.keys(errors)[0];
                    const firstError = errors[firstErrorKey];
                    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    setError(errorMessage || "Validation error. Please check your input.");
                } else if (err.response?.data?.message) {
                    setError(err.response.data.message);
                } else {
                    setError("Invalid email or password. Please try again.");
                }
            } else if (err.response?.status === 419) {
                // CSRF token mismatch
                setError("CSRF token validation failed. Please refresh the page and try again.");
            } else if (err.response?.status === 401) {
                setError("Invalid email or password. Please try again.");
            } else if (err.message && err.message.includes('CSRF')) {
                setError(err.message);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Login failed. Please check your credentials and try again.");
            }
            console.error("Login Error:", err);
            console.error("Error response data:", err.response?.data);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email and password to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent suppressHydrationWarning>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {!isMounted ? (
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
                    ) : (
                        <LoginForm onSubmit={onSubmit} loading={loading} />
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline">
                            Register
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
