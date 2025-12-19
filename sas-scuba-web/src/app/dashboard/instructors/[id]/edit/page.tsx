"use client";

import { Header } from "@/components/layout/Header";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { instructorService, Instructor } from "@/lib/api/services/instructor.service";

export default function EditInstructorPage() {
    const params = useParams();
    const id = params.id as string;
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchInstructor = async () => {
            try {
                const data = await instructorService.getById(id);
                setInstructor(data);
            } catch (error) {
                console.error("Failed to fetch instructor", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructor();
    }, [id]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!instructor) {
        return <div className="p-8">Instructor not found</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Instructor" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/instructors">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Instructor</h2>
                        <p className="text-muted-foreground">Update instructor details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <InstructorForm initialData={instructor} instructorId={id} />
                </div>
            </div>
        </div>
    );
}

