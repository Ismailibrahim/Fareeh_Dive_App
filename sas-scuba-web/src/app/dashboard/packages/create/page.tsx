"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";

// Lazy load PackageForm to reduce initial bundle size
const PackageForm = dynamic(() => import("@/components/packages/PackageForm").then(mod => ({ default: mod.PackageForm })), {
    loading: () => (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    ),
    ssr: false, // Forms don't need SSR
});

export default function CreatePackagePage() {
    return (
        <div className="space-y-6">
            <Header title="Create Package Template" />
            <PackageForm />
        </div>
    );
}

