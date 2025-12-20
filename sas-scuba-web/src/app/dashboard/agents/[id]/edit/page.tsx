"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AgentForm } from "@/components/agents/AgentForm";
import { agentService, Agent } from "@/lib/api/services/agent.service";

export default function EditAgentPage() {
    const params = useParams();
    const router = useRouter();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgent = async () => {
            const agentId = params.id as string;
            if (!agentId) {
                router.push("/dashboard/agents");
                return;
            }
            
            try {
                const data = await agentService.getById(agentId);
                setAgent(data);
            } catch (error) {
                console.error("Failed to fetch agent", error);
                router.push("/dashboard/agents");
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Edit Agent" />
                <div className="flex-1 p-8 pt-6">
                    <div className="max-w-5xl mx-auto">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!agent) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Edit Agent" />
            <div className="flex-1 p-8 pt-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Edit Agent</h2>
                    <AgentForm initialData={agent} agentId={params.id as string} />
                </div>
            </div>
        </div>
    );
}

