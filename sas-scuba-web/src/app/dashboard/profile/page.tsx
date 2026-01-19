"use client";

import { Header } from "@/components/layout/Header";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/api/services/auth.service";
import { User } from "@/types/auth";
import { User as UserIcon, Mail, Phone, Shield, Calendar, Building2 } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function ProfilePage() {
    // Use React Query to fetch user data (same as dashboard layout)
    const { data: user, isLoading, error } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const userData = await authService.getUser();
            if (userData && typeof userData === 'object') {
                return {
                    ...userData,
                    name: userData.full_name || userData.name,
                } as User;
            } else {
                throw new Error('Invalid user data received');
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Profile" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Profile" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Failed to load profile</p>
                        <p className="text-sm text-muted-foreground">
                            {error instanceof Error ? error.message : "An error occurred"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Profile" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Manage your account information and preferences.</p>
                </div>

                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Profile Overview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                Profile Overview
                            </CardTitle>
                            <CardDescription>
                                Your account information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                        {user.full_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">{user.full_name}</h3>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {user.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{user.phone}</span>
                                            </div>
                                        )}
                                        {user.role && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Shield className="h-4 w-4" />
                                                <span className="capitalize">{user.role}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Joined {safeFormatDate(user.created_at, "MMM dd, yyyy")}</span>
                                        </div>
                                        {user.dive_center_id && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Building2 className="h-4 w-4" />
                                                <span>Dive Center ID: {user.dive_center_id}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Edit Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Profile</CardTitle>
                            <CardDescription>
                                Update your personal information and change your password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm user={user} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
