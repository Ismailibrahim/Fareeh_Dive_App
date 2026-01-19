"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { Menu } from "lucide-react";
import { authService } from "@/lib/api/services/auth.service";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/auth";

export function Header({ title }: { title: string }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Fetch user data for display in dropdown
    const { data: user } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const userData = await authService.getUser();
            if (userData && typeof userData === 'object') {
                return {
                    ...userData,
                    name: userData.full_name || userData.name,
                } as User;
            }
            return null;
        },
        staleTime: 10 * 60 * 1000,
        retry: false,
    });

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            // Even if logout fails (expired session, CSRF), we still route to login.
            console.error("Logout failed", error);
        } finally {
            router.push("/login");
        }
    };

    return (
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shadow-sm dark:bg-slate-950 dark:border-slate-800 sticky top-0 z-40 w-full">
            <div className="flex items-center gap-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-slate-800 bg-slate-900 w-64 text-white">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SidebarContent onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
                <h1 className="text-lg font-semibold md:text-xl text-slate-800 dark:text-slate-100">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                <AvatarImage src="" alt="User" />
                                <AvatarFallback>
                                    {user?.full_name 
                                        ? user.full_name.substring(0, 2).toUpperCase()
                                        : user?.name
                                        ? user.name.substring(0, 2).toUpperCase()
                                        : "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.full_name || user?.name || "User"}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email || ""}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                router.push("/dashboard/profile");
                            }}
                        >
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                router.push("/dashboard/settings");
                            }}
                        >
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                void handleLogout();
                            }}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
