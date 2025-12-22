"use client";

import { DiveLogForm } from "@/components/dive-logs/DiveLogForm";
import { Header } from "@/components/layout/Header";

export default function CreateDiveLogPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Create Dive Log" />
            <div className="flex-1 p-8 pt-6">
                <DiveLogForm />
            </div>
        </div>
    );
}


