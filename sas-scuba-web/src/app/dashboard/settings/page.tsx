"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CompanyForm } from "@/components/settings/CompanyForm";
import { PaymentMethodsList } from "@/components/settings/PaymentMethodsList";
import { NationalitiesList } from "@/components/settings/NationalitiesList";
import { UnitsList } from "@/components/settings/UnitsList";
import { IslandsList } from "@/components/settings/IslandsList";
import { CountriesList } from "@/components/settings/CountriesList";
import { RelationshipsList } from "@/components/settings/RelationshipsList";
import { AgenciesList } from "@/components/settings/AgenciesList";
import { LocationsList } from "@/components/settings/LocationsList";
import { CategoriesList } from "@/components/settings/CategoriesList";
import { ServiceProvidersList } from "@/components/settings/ServiceProvidersList";
import { CurrencyRatesManager } from "@/components/settings/CurrencyRatesManager";
import { ServiceTypesList } from "@/components/settings/ServiceTypesList";
import { TaxManager } from "@/components/settings/TaxManager";
import { Building2, Settings2, CreditCard, Palette, Globe, ChevronDown, DollarSign, Percent, Users } from "lucide-react";
import { UsersList } from "@/components/settings/UsersList";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";

const sidebarNavItems = [
    {
        title: "General",
        id: "general",
        icon: Building2,
        description: "Company details and branding",
    },
    {
        title: "Localization",
        id: "localization",
        icon: Globe,
        description: "Currency, timezone, and formats",
    },
    {
        title: "Currency Rates",
        id: "currency-rates",
        icon: DollarSign,
        description: "Manage currency conversion rates",
    },
    {
        title: "Tax",
        id: "tax",
        icon: Percent,
        description: "Manage tax, commission, and service charges",
    },
    {
        title: "Payment Methods",
        id: "billing",
        icon: CreditCard,
        description: "Manage accepted payment types",
    },
    {
        title: "Users",
        id: "users",
        icon: Users,
        description: "Manage user accounts and permissions",
    },
    {
        title: "System Preferences",
        id: "preferences",
        icon: Settings2,
        description: "Global system toggles",
    },
    {
        title: "Interface",
        id: "ui",
        icon: Palette,
        description: "Customize dashboard appearance",
    },
    {
        title: "Dropdown",
        id: "dropdown",
        icon: ChevronDown,
        description: "Manage dropdown options",
    },
];

interface SettingsSidebarProps extends React.HTMLAttributes<HTMLElement> {
    items: typeof sidebarNavItems;
    activeTab: string;
    onTabChange: (id: string) => void;
}

function SettingsSidebar({ className, items, activeTab, onTabChange, ...props }: SettingsSidebarProps) {
    return (
        <nav
            className={cn(
                "flex flex-col space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                        "group flex items-center lg:items-start gap-3 rounded-lg p-3 text-left text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                        activeTab === item.id
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm border-slate-200 dark:border-slate-700"
                            : "text-muted-foreground hover:text-primary"
                    )}
                >
                    <item.icon className={cn("h-5 w-5 shrink-0", activeTab === item.id ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
                    <div className="block">
                        <div className="font-semibold">{item.title}</div>
                        <div className="hidden lg:block text-xs font-normal text-muted-foreground line-clamp-1">{item.description}</div>
                    </div>
                </button>
            ))}
        </nav>
    );
}

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && sidebarNavItems.some(item => item.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Settings" />
            <div className="space-y-6 pb-16 block px-4 md:px-8 max-w-7xl mx-auto w-full pt-6">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your dive center settings, localization, and system preferences.
                    </p>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="lg:w-1/4">
                        <SettingsSidebar
                            items={sidebarNavItems}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </aside>
                    <div className="flex-1 lg:max-w-4xl">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === "general" && <CompanyForm />}
                            {activeTab === "localization" && <div className="p-12 text-center text-muted-foreground">Localization Settings (Coming Soon)</div>}
                            {activeTab === "currency-rates" && <CurrencyRatesManager />}
                            {activeTab === "tax" && <TaxManager />}
                            {activeTab === "billing" && <PaymentMethodsList />}
                            {activeTab === "users" && <UsersList />}
                            {activeTab === "preferences" && <div className="p-12 text-center text-muted-foreground">System Preferences (Coming Soon)</div>}
                            {activeTab === "ui" && <div className="p-12 text-center text-muted-foreground">UI Interface Settings (Coming Soon)</div>}
                            {activeTab === "dropdown" && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Nationalities</h3>
                                        <NationalitiesList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Units</h3>
                                        <UnitsList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Islands</h3>
                                        <IslandsList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Countries</h3>
                                        <CountriesList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Relationships</h3>
                                        <RelationshipsList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Agencies</h3>
                                        <AgenciesList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Service Types</h3>
                                        <ServiceTypesList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Locations</h3>
                                        <LocationsList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Categories</h3>
                                        <CategoriesList />
                                    </div>
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold mb-4">Service Providers</h3>
                                        <ServiceProvidersList />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
