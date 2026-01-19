"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkAssignAgent } from "@/lib/hooks/use-customers";
import { agentService, Agent } from "@/lib/api/services/agent.service";
import { Building2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const assignAgentSchema = z.object({
    agent_id: z.string().optional(),
});

interface BulkAssignAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCustomerIds: number[];
    onSuccess: () => void;
}

export function BulkAssignAgentDialog({
    open,
    onOpenChange,
    selectedCustomerIds,
    onSuccess,
}: BulkAssignAgentDialogProps) {
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const bulkAssignMutation = useBulkAssignAgent();

    const form = useForm<z.infer<typeof assignAgentSchema>>({
        resolver: zodResolver(assignAgentSchema),
        defaultValues: {
            agent_id: undefined,
        },
    });

    // Fetch agents when dialog opens
    useEffect(() => {
        if (open) {
            fetchAgents();
            form.reset({
                agent_id: undefined,
            });
        }
    }, [open, form]);

    const fetchAgents = async () => {
        setLoadingAgents(true);
        try {
            const data = await agentService.getAll({ status: 'Active' });
            const agentList = Array.isArray(data) ? data : (data as any).data || [];
            setAgents(agentList);
        } catch (error) {
            console.error("Failed to fetch agents", error);
        } finally {
            setLoadingAgents(false);
        }
    };

    async function onSubmit(data: z.infer<typeof assignAgentSchema>) {
        if (selectedCustomerIds.length === 0) {
            alert("Please select at least one customer.");
            return;
        }

        const agentId = data.agent_id && data.agent_id !== "none" && data.agent_id !== "" 
            ? parseInt(data.agent_id) 
            : null;

        try {
            await bulkAssignMutation.mutateAsync({
                customerIds: selectedCustomerIds,
                agentId: agentId,
            });
            form.reset();
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to assign agent", error);
            const errorMessage = error?.response?.data?.message || 
                               error?.response?.data?.error || 
                               error?.message || 
                               "Failed to assign agent. Please try again.";
            alert(errorMessage);
        }
    }

    const selectedCount = selectedCustomerIds.length;
    const isLoading = bulkAssignMutation.isPending || loadingAgents;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Assign Agent to Customers
                    </DialogTitle>
                    <DialogDescription>
                        Assign an agent to {selectedCount} selected customer{selectedCount !== 1 ? 's' : ''}.
                        This will apply to future bookings only.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex items-center gap-2 py-2">
                            <Badge variant="secondary" className="text-sm">
                                {selectedCount} customer{selectedCount !== 1 ? 's' : ''} selected
                            </Badge>
                        </div>

                        <FormField
                            control={form.control}
                            name="agent_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agent</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value && field.value !== "" ? field.value : undefined}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    loadingAgents 
                                                        ? "Loading agents..." 
                                                        : agents.length === 0 
                                                        ? "No agents available" 
                                                        : "Select an agent (optional)"
                                                } />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None (Remove Agent)</SelectItem>
                                            {agents.map((agent) => (
                                                <SelectItem key={agent.id} value={String(agent.id)}>
                                                    {agent.agent_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    <p className="text-sm text-muted-foreground">
                                        Select an agent to assign, or "None" to remove agent assignment from selected customers.
                                    </p>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    "Assign Agent"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
