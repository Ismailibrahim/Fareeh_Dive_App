import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, Customer, CustomerFormData, PaginationParams, PaginatedResponse } from "@/lib/api/services/customer.service";

// Query keys for customers
export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...customerKeys.lists(), params] as const,
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...customerKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of customers
 */
export function useCustomers(params?: PaginationParams) {
    return useQuery({
        queryKey: customerKeys.list(params),
        queryFn: () => customerService.getAll(params),
        staleTime: 2 * 60 * 1000, // 2 minutes - customers list changes frequently
    });
}

/**
 * Hook to fetch a single customer by ID
 */
export function useCustomer(id: number | string | null) {
    return useQuery({
        queryKey: customerKeys.detail(id!),
        queryFn: () => customerService.getById(id!),
        enabled: !!id, // Only fetch if id is provided
        staleTime: 10 * 60 * 1000, // 10 minutes - customer data persists longer
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        refetchOnMount: false, // Don't refetch when component remounts if data is fresh
    });
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CustomerFormData) => customerService.create(data),
        onSuccess: () => {
            // Invalidate customers list to refetch
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) =>
            customerService.update(id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific customer
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete a customer
 */
export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customerService.delete(id),
        onSuccess: () => {
            // Invalidate customers list to refetch
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
}

