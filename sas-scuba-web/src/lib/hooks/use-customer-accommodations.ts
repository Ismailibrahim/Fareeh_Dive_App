import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerAccommodationService, CustomerAccommodation, CustomerAccommodationFormData } from "@/lib/api/services/customer-accommodation.service";

// Query keys for customer accommodations
export const customerAccommodationKeys = {
    all: ['customer-accommodations'] as const,
    lists: () => [...customerAccommodationKeys.all, 'list'] as const,
    list: (customerId?: number) => [...customerAccommodationKeys.lists(), customerId] as const,
    details: () => [...customerAccommodationKeys.all, 'detail'] as const,
    detail: (id: number) => [...customerAccommodationKeys.details(), id] as const,
};

/**
 * Hook to fetch accommodation for a customer (one-to-one relationship)
 */
export function useCustomerAccommodations(customerId: number | string | null) {
    return useQuery({
        queryKey: customerAccommodationKeys.list(customerId ? Number(customerId) : undefined),
        queryFn: async () => {
            const data = await customerAccommodationService.getAll(customerId ? Number(customerId) : undefined);
            // Since it's one-to-one, return the first item or null
            return Array.isArray(data) && data.length > 0 ? data[0] : null;
        },
        enabled: !!customerId,
        staleTime: 5 * 60 * 1000, // 5 minutes - related data changes less frequently
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    });
}

/**
 * Hook to fetch a single accommodation by ID
 */
export function useCustomerAccommodation(id: number | null) {
    return useQuery({
        queryKey: customerAccommodationKeys.detail(id!),
        queryFn: () => customerAccommodationService.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to create a new customer accommodation
 */
export function useCreateCustomerAccommodation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CustomerAccommodationFormData) =>
            customerAccommodationService.create(data),
        onSuccess: (data) => {
            // Invalidate accommodation list for this customer
            queryClient.invalidateQueries({ queryKey: customerAccommodationKeys.list(data.customer_id) });
        },
    });
}

/**
 * Hook to update a customer accommodation
 */
export function useUpdateCustomerAccommodation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CustomerAccommodationFormData> }) =>
            customerAccommodationService.update(id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific accommodation
            queryClient.invalidateQueries({ queryKey: customerAccommodationKeys.list(data.customer_id) });
            queryClient.invalidateQueries({ queryKey: customerAccommodationKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete a customer accommodation with optimistic updates
 */
export function useDeleteCustomerAccommodation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customerAccommodationService.delete(id),
        onMutate: async (id) => {
            // We need to find which customer this accommodation belongs to
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: customerAccommodationKeys.all });

            // Get the accommodation to find customer_id
            const accommodation = queryClient.getQueryData<CustomerAccommodation>(customerAccommodationKeys.detail(id));
            
            if (accommodation) {
                // Optimistically set to null (one-to-one relationship)
                queryClient.setQueryData<CustomerAccommodation | null>(
                    customerAccommodationKeys.list(accommodation.customer_id),
                    null
                );

                // Return a context object
                return { previousAccommodation: accommodation, customerId: accommodation.customer_id };
            }
        },
        onError: (err, id, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousAccommodation && context.customerId) {
                queryClient.setQueryData(
                    customerAccommodationKeys.list(context.customerId),
                    context.previousAccommodation
                );
            }
        },
        onSettled: (data, error, id, context) => {
            // Always refetch after error or success to ensure consistency
            if (context?.customerId) {
                queryClient.invalidateQueries({ queryKey: customerAccommodationKeys.list(context.customerId) });
            }
        },
    });
}

