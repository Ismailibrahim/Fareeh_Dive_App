import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentItemService, EquipmentItem, EquipmentItemFormData, PaginationParams, PaginatedResponse } from "@/lib/api/services/equipment-item.service";

// Query keys for equipment items
export const equipmentItemKeys = {
    all: ['equipment-items'] as const,
    lists: () => [...equipmentItemKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...equipmentItemKeys.lists(), params] as const,
    details: () => [...equipmentItemKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...equipmentItemKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of equipment items
 */
export function useEquipmentItems(params?: PaginationParams) {
    return useQuery({
        queryKey: equipmentItemKeys.list(params),
        queryFn: () => equipmentItemService.getAll(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to fetch a single equipment item by ID
 */
export function useEquipmentItem(id: number | string | null) {
    return useQuery({
        queryKey: equipmentItemKeys.detail(id!),
        queryFn: () => equipmentItemService.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to create a new equipment item
 */
export function useCreateEquipmentItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EquipmentItemFormData) => equipmentItemService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentItemKeys.lists() });
        },
    });
}

/**
 * Hook to update an equipment item
 */
export function useUpdateEquipmentItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: EquipmentItemFormData }) =>
            equipmentItemService.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: equipmentItemKeys.lists() });
            queryClient.invalidateQueries({ queryKey: equipmentItemKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete an equipment item
 */
export function useDeleteEquipmentItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => equipmentItemService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentItemKeys.lists() });
        },
    });
}

