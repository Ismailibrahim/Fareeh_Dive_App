"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/services/auth.service';
import { User } from '@/types/auth';

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const userData = await authService.getUser();
                setUser(userData);
            } catch (error: any) {
                console.error('Auth check failed:', error);
                // Only redirect if it's an authentication error (401/403)
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    router.push('/login');
                } else {
                    // For other errors, still set loading to false to show the page
                    // but log the error
                    console.error('Non-auth error during user check:', error);
                }
            } finally {
                setLoading(false);
            }
        }

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Or redirect handled in useEffect
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
