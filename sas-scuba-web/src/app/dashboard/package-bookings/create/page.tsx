"use client";

import { PackageBookingForm } from "@/components/packages/PackageBookingForm";
import { Header } from "@/components/layout/Header";

export default function CreatePackageBookingPage() {
    return (
        <div className="space-y-6">
            <Header title="Create Package Booking" />
            <PackageBookingForm />
        </div>
    );
}

