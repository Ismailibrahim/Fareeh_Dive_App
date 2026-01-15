"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { packageService, Package } from "@/lib/api/services/package.service";

// Lazy load PackageForm to reduce initial bundle size
const PackageForm = dynamic(() => import("@/components/packages/PackageForm").then(mod => ({ default: mod.PackageForm })), {
    loading: () => (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    ),
    ssr: false, // Forms don't need SSR
});

export default function EditPackagePage() {
    const params = useParams();
    const packageId = params.id as string;
    const [packageData, setPackageData] = useState<Package | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (packageId) {
            loadPackage();
        }
    }, [packageId]);

    const loadPackage = async () => {
        try {
            const data = await packageService.getById(packageId);
            setPackageData(data);
        } catch (error) {
            console.error("Failed to load package", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Header title="Edit Package Template" />
                <div className="text-center py-8">Loading package...</div>
            </div>
        );
    }

    if (!packageData) {
        return (
            <div className="space-y-6">
                <Header title="Edit Package Template" />
                <div className="text-center py-8">Package not found</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Header title="Edit Package Template" />
            <PackageForm initialData={packageData} packageId={packageId} />
        </div>
    );
}

