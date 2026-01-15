"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/lib/api/services/auth.service';
import { User } from '@/types/auth';

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    
    // Use React Query for auth check with caching
    const { data: user, isLoading, error } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const userData = await authService.getUser();
            // Ensure user data is in the expected format
            if (userData && typeof userData === 'object') {
                // Map full_name to name for backward compatibility if needed
                return {
                    ...userData,
                    name: userData.full_name || userData.name,
                } as User;
            } else {
                throw new Error('Invalid user data received');
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - user data doesn't change often
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        retry: false, // Don't retry on auth failures
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch on component remount if data is fresh
    });

    // Handle errors separately (React Query v5 doesn't support onError in useQuery)
    useEffect(() => {
        if (error) {
            const errorAny = error as any;
            const status = errorAny?.response?.status;
            const errorMessage = errorAny?.response?.data?.message || errorAny?.message;
            
            // Log error details for debugging (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.error('Auth check failed:', {
                    status,
                    message: errorMessage,
                    error: errorAny?.response?.data || errorAny,
                });
            }
            
            // Handle different error scenarios
            if (status === 401 || status === 403 || status === 404) {
                // Authentication/authorization error - redirect to login
                router.push('/login');
            } else if (status >= 500) {
                // Server error - log but don't redirect, allow user to retry
                console.error('Server error during auth check:', errorMessage);
            } else {
                // Other errors (network, etc.) - log but don't redirect
                if (process.env.NODE_ENV === 'development') {
                    console.error('Non-auth error during user check:', errorMessage);
                }
            }
        }
    }, [error, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Redirect handled in onError
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-all duration-300 ease-in-out">
                {children}
            </main>
        </div>
    );
}
