import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionService, AgentCommission, CommissionFilterParams, UpdateCommissionRequest } from "@/lib/api/services/commission.service";
import { toast } from "sonner";

export function useCommissions(params?: CommissionFilterParams) {
    return useQuery({
        queryKey: ["commissions", params],
        queryFn: () => commissionService.getAll(params),
    });
}

export function useCommission(id: string | number) {
    return useQuery({
        queryKey: ["commissions", id],
        queryFn: () => commissionService.getById(id),
        enabled: !!id,
    });
}

export function useUpdateCommission() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCommissionRequest }) =>
            commissionService.updateStatus(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["commissions"] });
            queryClient.invalidateQueries({ queryKey: ["commissions", data.id] });
            toast.success("Commission updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update commission");
        },
    });
}

export function useMarkCommissionAsPaid() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({
            id,
            paymentDate,
            paymentMethodId,
            paymentReference,
            paymentNotes,
        }: {
            id: number;
            paymentDate?: string;
            paymentMethodId?: number;
            paymentReference?: string;
            paymentNotes?: string;
        }) =>
            commissionService.markAsPaid(id, paymentDate, paymentMethodId, paymentReference, paymentNotes),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["commissions"] });
            queryClient.invalidateQueries({ queryKey: ["commissions", data.id] });
            toast.success("Commission marked as paid");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to mark commission as paid");
        },
    });
}

export function useCancelCommission() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
            commissionService.cancel(id, reason),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["commissions"] });
            queryClient.invalidateQueries({ queryKey: ["commissions", data.id] });
            toast.success("Commission cancelled");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to cancel commission");
        },
    });
}

export function useCalculateCommissions() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ agentId, invoiceIds }: { agentId: number; invoiceIds?: number[] }) =>
            commissionService.calculateForAgent(agentId, invoiceIds),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["commissions"] });
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            toast.success(`Successfully calculated ${data.count} commission(s)`);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || "Failed to calculate commissions");
        },
    });
}
