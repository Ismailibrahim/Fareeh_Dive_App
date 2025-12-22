"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DiveLogForm } from "@/components/dive-logs/DiveLogForm";
import { Header } from "@/components/layout/Header";
import { diveLogService, DiveLog } from "@/lib/api/services/dive-log.service";

export default function EditDiveLogPage() {
    const params = useParams();
    const [diveLog, setDiveLog] = useState<DiveLog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadDiveLog();
        }
    }, [params.id]);

    const loadDiveLog = async () => {
        setLoading(true);
        try {
            const data = await diveLogService.getById(params.id);
            setDiveLog(data);
        } catch (error) {
            console.error("Failed to load dive log", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Edit Dive Log" />
                <div className="flex-1 p-8 pt-6">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!diveLog) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Edit Dive Log" />
                <div className="flex-1 p-8 pt-6">
                    <p>Dive log not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Edit Dive Log" />
            <div className="flex-1 p-8 pt-6">
                <DiveLogForm initialData={diveLog} diveLogId={diveLog.id} />
            </div>
        </div>
    );
}


