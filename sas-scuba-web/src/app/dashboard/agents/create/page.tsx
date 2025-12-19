"use client";

import { Header } from "@/components/layout/Header";
import { AgentForm } from "@/components/agents/AgentForm";

export default function CreateAgentPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Create Agent" />
            <div className="flex-1 p-8 pt-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Create New Agent</h2>
                    <AgentForm />
                </div>
            </div>
        </div>
    );
}

