import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waiverService, WaiverSignature } from "@/lib/api/services/waiver.service";

// Query keys for waiver signatures
export const waiverSignatureKeys = {
    all: ['waiver-signatures'] as const,
    lists: () => [...waiverSignatureKeys.all, 'list'] as const,
    list: (customerId?: number) => [...waiverSignatureKeys.lists(), customerId] as const,
    details: () => [...waiverSignatureKeys.all, 'detail'] as const,
    detail: (id: number) => [...waiverSignatureKeys.details(), id] as const,
};

/**
 * Hook to fetch waiver signatures for a customer
 */
export function useWaiverSignatures(customerId: number | string | null) {
    return useQuery({
        queryKey: waiverSignatureKeys.list(customerId ? Number(customerId) : undefined),
        queryFn: async () => {
            if (!customerId) return { data: [] };
            const response = await waiverService.getSignatures({ customer_id: Number(customerId) });
            return response;
        },
        enabled: !!customerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Hook to fetch a single signature by ID
 */
export function useWaiverSignature(id: number | null) {
    return useQuery({
        queryKey: waiverSignatureKeys.detail(id!),
        queryFn: async () => {
            // We need to get the signature - but there's no getById endpoint
            // So we'll need to fetch from list and filter
            // For now, return null - this can be enhanced later
            return null;
        },
        enabled: false, // Disabled until we have a proper endpoint
    });
}

/**
 * Hook to create a new waiver signature
 */
export function useCreateWaiverSignature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            waiver_id: number;
            customer_id: number;
            signature_data: string;
            booking_id?: number;
            form_data?: Record<string, any>;
            witness_user_id?: number;
            signature_format?: string;
        }) => waiverService.createSignature(data),
        onSuccess: (data) => {
            // Invalidate signatures list for this customer
            queryClient.invalidateQueries({ 
                queryKey: waiverSignatureKeys.list(data.data?.customer_id) 
            });
        },
    });
}

/**
 * Hook to verify a waiver signature
 */
export function useVerifyWaiverSignature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ signatureId, status, notes }: { 
            signatureId: number; 
            status: 'verified' | 'rejected'; 
            notes?: string 
        }) => waiverService.verifySignature(signatureId, status, notes),
        onSuccess: (data) => {
            // Invalidate signatures list for this customer
            if (data.data?.customer_id) {
                queryClient.invalidateQueries({ 
                    queryKey: waiverSignatureKeys.list(data.data.customer_id) 
                });
            }
        },
    });
}

/**
 * Hook to invalidate a waiver signature
 */
export function useInvalidateWaiverSignature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ signatureId, reason }: { signatureId: number; reason: string }) =>
            waiverService.invalidateSignature(signatureId, reason),
        onSuccess: (data, variables) => {
            // We need to invalidate all lists since we don't know the customer_id
            queryClient.invalidateQueries({ queryKey: waiverSignatureKeys.lists() });
        },
    });
}
