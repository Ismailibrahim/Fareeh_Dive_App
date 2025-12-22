import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { diveLogService, DiveLog, DiveLogFormData, PaginationParams, PaginatedResponse } from "@/lib/api/services/dive-log.service";

// Query keys for dive logs
export const diveLogKeys = {
    all: ['dive-logs'] as const,
    lists: () => [...diveLogKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...diveLogKeys.lists(), params] as const,
    details: () => [...diveLogKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...diveLogKeys.details(), id] as const,
    byCustomer: (customerId: number | string, params?: PaginationParams) => 
        [...diveLogKeys.all, 'customer', customerId, params] as const,
};

/**
 * Hook to fetch paginated list of dive logs
 */
export function useDiveLogs(params?: PaginationParams) {
    return useQuery({
        queryKey: diveLogKeys.list(params),
        queryFn: () => diveLogService.getAll(params),
        staleTime: 2 * 60 * 1000, // 2 minutes - dive logs list changes frequently
    });
}

/**
 * Hook to fetch a single dive log by ID
 */
export function useDiveLog(id: number | string | null) {
    return useQuery({
        queryKey: diveLogKeys.detail(id!),
        queryFn: () => diveLogService.getById(id!),
        enabled: !!id, // Only fetch if id is provided
        staleTime: 10 * 60 * 1000, // 10 minutes - dive log data persists longer
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        refetchOnMount: false, // Don't refetch when component remounts if data is fresh
    });
}

/**
 * Hook to fetch dive logs for a specific customer
 */
export function useDiveLogsByCustomer(customerId: number | string | null, params?: PaginationParams) {
    return useQuery({
        queryKey: diveLogKeys.byCustomer(customerId!, params),
        queryFn: () => diveLogService.getByCustomer(customerId!, params),
        enabled: !!customerId, // Only fetch if customerId is provided
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to create a new dive log
 */
export function useCreateDiveLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: DiveLogFormData) => diveLogService.create(data),
        onSuccess: () => {
            // Invalidate dive logs list to refetch
            queryClient.invalidateQueries({ queryKey: diveLogKeys.lists() });
        },
    });
}

/**
 * Hook to update a dive log
 */
export function useUpdateDiveLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<DiveLogFormData> }) =>
            diveLogService.update(id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific dive log
            queryClient.invalidateQueries({ queryKey: diveLogKeys.lists() });
            queryClient.invalidateQueries({ queryKey: diveLogKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete a dive log
 */
export function useDeleteDiveLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => diveLogService.delete(id),
        onSuccess: () => {
            // Invalidate dive logs list to refetch
            queryClient.invalidateQueries({ queryKey: diveLogKeys.lists() });
        },
    });
}

