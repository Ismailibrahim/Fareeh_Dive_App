"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
    ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/api/services/auth.service";
import { useRouter } from "next/navigation";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
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
        title: "Certifications",
        href: "/dashboard/customer-certifications",
        icon: Award,
    },
    {
        title: "Emergency Contacts",
        href: "/dashboard/emergency-contacts",
        icon: AlertCircle,
    },
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
        title: "Service",
        href: "/dashboard/services",
        icon: Wrench,
    },
    {
        title: "Dive Log",
        href: "/dashboard/dives",
        icon: Anchor,
    },
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
        title: "Sites & Boats",
        href: "/dashboard/assets",
        icon: Map,
    },
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
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.push("/login");
            onNavigate?.();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="flex h-full flex-col bg-slate-900 text-slate-100">
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight" onClick={onNavigate}>
                    <Anchor className="h-6 w-6 text-blue-400" />
                    <span className="text-white">SAS Scuba</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="grid gap-2 text-sm font-medium">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-white",
                                    isActive
                                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                                        : "text-slate-400 hover:bg-slate-800/50"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto border-t border-slate-800 p-4">
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
