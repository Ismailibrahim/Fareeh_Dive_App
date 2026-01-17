"use client";

import { Header } from "@/components/layout/Header";
import { DiveGroupForm } from "@/components/dive-groups/DiveGroupForm";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DiveGroup, diveGroupService } from "@/lib/api/services/dive-group.service";

export default function EditDiveGroupPage() {
    const params = useParams();
    const id = params.id as string;
    const [group, setGroup] = useState<DiveGroup | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            diveGroupService.getById(id).then(setGroup).catch(console.error).finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Edit Dive Group" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Edit Dive Group" />
            <div className="flex-1 p-8 pt-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Edit Dive Group</h2>
                    {group && <DiveGroupForm initialData={group} groupId={id} />}
                </div>
            </div>
        </div>
    );
}

