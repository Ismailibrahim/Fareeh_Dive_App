"use client";

import { Header } from "@/components/layout/Header";
import { DiveGroupForm } from "@/components/dive-groups/DiveGroupForm";

export default function CreateDiveGroupPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Create Dive Group" />
            <div className="flex-1 p-8 pt-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Create New Dive Group</h2>
                    <DiveGroupForm />
                </div>
            </div>
        </div>
    );
}

