import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentService, Equipment, EquipmentFormData, PaginationParams, PaginatedResponse } from "@/lib/api/services/equipment.service";

// Query keys for equipment
export const equipmentKeys = {
    all: ['equipment'] as const,
    lists: () => [...equipmentKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...equipmentKeys.lists(), params] as const,
    details: () => [...equipmentKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...equipmentKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of equipment
 */
export function useEquipment(params?: PaginationParams) {
    return useQuery({
        queryKey: equipmentKeys.list(params),
        queryFn: () => equipmentService.getAll(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to fetch a single equipment by ID
 */
export function useEquipmentItem(id: number | string | null) {
    return useQuery({
        queryKey: equipmentKeys.detail(id!),
        queryFn: () => equipmentService.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to create new equipment
 */
export function useCreateEquipment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EquipmentFormData) => equipmentService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
        },
    });
}

/**
 * Hook to update equipment
 */
export function useUpdateEquipment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: EquipmentFormData }) =>
            equipmentService.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete equipment
 */
export function useDeleteEquipment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => equipmentService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
        },
    });
}

