"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Anchor,
    Settings,
    LogOut,
    Map,
    FileText,
    Award,
    Package,
    Boxes,
    AlertCircle,
    DollarSign,
    Ship,
    GraduationCap,
    Waves,
    MapPin,
    Wrench,
    ShoppingBasket,
    Building2,
    ClipboardCheck,
    ChevronDown,
    ChevronRight,
    Receipt,
    Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { authService } from "@/lib/api/services/auth.service";
import { useRouter } from "next/navigation";

// Menu structure with grouped items
const menuGroups = [
    {
        id: "overview",
        title: "Overview",
        icon: LayoutDashboard,
        items: [
            {
                title: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        id: "bookings",
        title: "Bookings",
        icon: CalendarDays,
        items: [
            {
                title: "Bookings",
                href: "/dashboard/bookings",
                icon: CalendarDays,
            },
            {
                title: "Booking Dives",
                href: "/dashboard/booking-dives",
                icon: Waves,
            },
            {
                title: "Booking Excursions",
                href: "/dashboard/booking-excursions",
                icon: MapPin,
            },
            {
                title: "Dive Logs",
                href: "/dashboard/dive-logs",
                icon: FileText,
            },
            {
                title: "Dive Packages",
                href: "/dashboard/dive-packages",
                icon: Package,
            },
            {
                title: "Booking Equipment",
                href: "/dashboard/booking-equipment",
                icon: Boxes,
            },
            {
                title: "Equipment Baskets",
                href: "/dashboard/baskets",
                icon: ShoppingBasket,
            },
            {
                title: "Booking Instructors",
                href: "/dashboard/booking-instructors",
                icon: GraduationCap,
            },
            {
                title: "Boat List",
                href: "/dashboard/boat-list",
                icon: Ship,
            },
        ],
    },
    {
        id: "customers",
        title: "Customers",
        icon: Users,
        items: [
            {
                title: "Customers",
                href: "/dashboard/customers",
                icon: Users,
            },
            {
                title: "Pre-Registrations",
                href: "/dashboard/pre-registrations",
                icon: ClipboardCheck,
            },
            {
                title: "Certifications",
                href: "/dashboard/customer-certifications",
                icon: Award,
            },
            {
                title: "Emergency Contacts",
                href: "/dashboard/emergency-contacts",
                icon: AlertCircle,
            },
        ],
    },
    {
        id: "people",
        title: "People",
        icon: Building2,
        items: [
            {
                title: "Agents",
                href: "/dashboard/agents",
                icon: Building2,
            },
            {
                title: "Instructors",
                href: "/dashboard/instructors",
                icon: GraduationCap,
            },
            {
                title: "Dive Groups",
                href: "/dashboard/dive-groups",
                icon: Users,
            },
        ],
    },
    {
        id: "equipment",
        title: "Equipment",
        icon: Package,
        items: [
            {
                title: "Equipment",
                href: "/dashboard/equipment",
                icon: Package,
            },
            {
                title: "Equipment Items",
                href: "/dashboard/equipment-items",
                icon: Boxes,
            },
            {
                title: "Service History",
                href: "/dashboard/services",
                icon: Wrench,
            },
        ],
    },
    {
        id: "assets",
        title: "Assets",
        icon: Map,
        items: [
            {
                title: "Boats",
                href: "/dashboard/boats",
                icon: Ship,
            },
            {
                title: "Dive Sites",
                href: "/dashboard/dive-sites",
                icon: MapPin,
            },
            {
                title: "Excursions",
                href: "/dashboard/excursions",
                icon: Map,
            },
            {
                title: "Sites & Boats",
                href: "/dashboard/assets",
                icon: Map,
            },
            {
                title: "Dive Log",
                href: "/dashboard/dives",
                icon: Anchor,
            },
        ],
    },
    {
        id: "financial",
        title: "Financial",
        icon: DollarSign,
        items: [
            {
                title: "Price List",
                href: "/dashboard/price-list",
                icon: DollarSign,
            },
            {
                title: "Invoices",
                href: "/dashboard/invoices",
                icon: FileText,
            },
            {
                title: "Expenses",
                href: "/dashboard/expenses",
                icon: Receipt,
            },
            {
                title: "Expense Categories",
                href: "/dashboard/expense-categories",
                icon: Tag,
            },
        ],
    },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    
    // Track which groups are open (default: open groups that contain active page)
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    // Initialize: open groups that contain the current active page
    useEffect(() => {
        const activeGroups = new Set<string>();
        menuGroups.forEach((group) => {
            const hasActiveItem = group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
            if (hasActiveItem) {
                activeGroups.add(group.id);
            }
        });
        setOpenGroups(activeGroups);
    }, [pathname]);

    const toggleGroup = (groupId: string) => {
        setOpenGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.push("/login");
            onNavigate?.();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const renderMenuItem = (item: typeof menuGroups[0]["items"][0], level: number = 0) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-white",
                    level > 0 && "ml-6",
                    isActive
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                        : "text-slate-400 hover:bg-slate-800/50"
                )}
            >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-full flex-col bg-slate-900 text-slate-100">
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight" onClick={onNavigate}>
                    <Anchor className="h-6 w-6 text-blue-400" />
                    <span className="text-white">SAS Scuba</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
                <nav className="space-y-1 text-sm font-medium">
                    {menuGroups.map((group) => {
                        const isOpen = openGroups.has(group.id);
                        const hasActiveItem = group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
                        
                        // Single item groups (like Overview) don't need collapsible
                        if (group.items.length === 1) {
                            return (
                                <div key={group.id}>
                                    {renderMenuItem(group.items[0])}
                                </div>
                            );
                        }

                        return (
                            <Collapsible
                                key={group.id}
                                open={isOpen}
                                onOpenChange={() => toggleGroup(group.id)}
                            >
                                <CollapsibleTrigger
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all hover:bg-slate-800/50",
                                        hasActiveItem && !isOpen && "bg-slate-800/30 text-white",
                                        !hasActiveItem && "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <group.icon className="h-4 w-4 shrink-0" />
                                        <span className="font-medium">{group.title}</span>
                                    </div>
                                    {isOpen ? (
                                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                    )}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-1 space-y-1 pl-2">
                                    {group.items.map((item) => renderMenuItem(item, 1))}
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto border-t border-slate-800 p-4">
                <Link
                    href="/dashboard/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 mb-2 transition-all",
                        pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    )}
                >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </Link>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <div className="hidden border-r bg-slate-900 text-slate-100 md:block w-64 flex-col fixed inset-y-0 z-50">
            <SidebarContent />
        </div>
    );
}
