"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiveGroup, DiveGroupFormData, diveGroupService } from "@/lib/api/services/dive-group.service";
import { agentService, Agent } from "@/lib/api/services/agent.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const diveGroupSchema = z.object({
    group_name: z.string().min(2, "Group name must be at least 2 characters."),
    agent_id: z.string().optional().or(z.literal("")),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
});

// Form values type (matches schema)
type DiveGroupFormValues = z.infer<typeof diveGroupSchema>;

interface DiveGroupFormProps {
    initialData?: DiveGroup;
    groupId?: string | number;
}

export function DiveGroupForm({ initialData, groupId }: DiveGroupFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await agentService.getAll({ status: 'Active' });
                const agentList = Array.isArray(response) ? response : (response as any).data || [];
                setAgents(agentList);
            } catch (error) {
                console.error("Failed to fetch agents", error);
            } finally {
                setLoadingAgents(false);
            }
        };
        fetchAgents();
    }, []);

    const form = useForm<DiveGroupFormValues>({
        resolver: zodResolver(diveGroupSchema),
        defaultValues: {
            group_name: initialData?.group_name || "",
            agent_id: initialData?.agent_id ? String(initialData.agent_id) : "",
            description: initialData?.description || "",
            status: (initialData?.status || 'Active') as 'Active' | 'Inactive',
        },
    });

    const onSubmit = async (data: DiveGroupFormValues) => {
        // Transform form data to API format
        const payload: DiveGroupFormData = {
            group_name: data.group_name,
            agent_id: data.agent_id && data.agent_id !== "" ? parseInt(data.agent_id) : undefined,
            description: data.description || undefined,
            status: data.status,
        };
        setLoading(true);
        try {
            if (groupId) {
                await diveGroupService.update(Number(groupId), payload);
            } else {
                await diveGroupService.create(payload);
            }
            router.push("/dashboard/dive-groups");
            router.refresh();
        } catch (error: any) {
            console.error("Failed to save dive group", error);
            const errorMessage = error?.response?.data?.message || "Failed to save dive group";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="group_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Group Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter group name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="agent_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agent</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                value={field.value || "none"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an agent (optional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">No agent</SelectItem>
                                    {loadingAgents ? (
                                        <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                                    ) : (
                                        agents.map((agent) => (
                                            <SelectItem key={agent.id} value={agent.id.toString()}>
                                                {agent.agent_name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Optional: Link this group to an agent for billing purposes.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter group description (optional)"
                                    {...field}
                                    rows={4}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {groupId ? "Update Group" : "Create Group"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

