import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emergencyContactService, EmergencyContact, EmergencyContactFormData } from "@/lib/api/services/emergency-contact.service";

// Query keys for emergency contacts
export const emergencyContactKeys = {
    all: ['emergency-contacts'] as const,
    lists: () => [...emergencyContactKeys.all, 'list'] as const,
    list: (customerId?: string | number) => [...emergencyContactKeys.lists(), customerId] as const,
    details: () => [...emergencyContactKeys.all, 'detail'] as const,
    detail: (customerId: string | number, id: string | number) => [...emergencyContactKeys.details(), customerId, id] as const,
};

/**
 * Hook to fetch emergency contacts for a customer
 */
export function useEmergencyContacts(customerId: string | number | null) {
    return useQuery({
        queryKey: emergencyContactKeys.list(customerId!),
        queryFn: () => emergencyContactService.getAll(customerId!),
        enabled: !!customerId,
        staleTime: 5 * 60 * 1000, // 5 minutes - related data changes less frequently
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    });
}

/**
 * Hook to fetch a single emergency contact by ID
 */
export function useEmergencyContact(customerId: string | number | null, id: string | number | null) {
    return useQuery({
        queryKey: emergencyContactKeys.detail(customerId!, id!),
        queryFn: () => emergencyContactService.getById(customerId!, id!),
        enabled: !!customerId && !!id,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to create a new emergency contact
 */
export function useCreateEmergencyContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, data }: { customerId: string | number; data: EmergencyContactFormData }) =>
            emergencyContactService.create(customerId, data),
        onSuccess: (data, variables) => {
            // Invalidate emergency contacts list for this customer
            queryClient.invalidateQueries({ queryKey: emergencyContactKeys.list(variables.customerId) });
        },
    });
}

/**
 * Hook to update an emergency contact
 */
export function useUpdateEmergencyContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, id, data }: { customerId: string | number; id: number; data: EmergencyContactFormData }) =>
            emergencyContactService.update(customerId, id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific emergency contact
            queryClient.invalidateQueries({ queryKey: emergencyContactKeys.list(variables.customerId) });
            queryClient.invalidateQueries({ queryKey: emergencyContactKeys.detail(variables.customerId, variables.id) });
        },
    });
}

/**
 * Hook to delete an emergency contact with optimistic updates
 */
export function useDeleteEmergencyContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, id }: { customerId: string | number; id: number }) =>
            emergencyContactService.delete(customerId, id),
        onMutate: async ({ customerId, id }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: emergencyContactKeys.list(customerId) });

            // Snapshot the previous value
            const previousContacts = queryClient.getQueryData<EmergencyContact[]>(emergencyContactKeys.list(customerId));

            // Optimistically update to the new value
            if (previousContacts) {
                queryClient.setQueryData<EmergencyContact[]>(
                    emergencyContactKeys.list(customerId),
                    previousContacts.filter((contact) => contact.id !== id)
                );
            }

            // Return a context object with the snapshotted value
            return { previousContacts };
        },
        onError: (err, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousContacts) {
                queryClient.setQueryData(emergencyContactKeys.list(variables.customerId), context.previousContacts);
            }
        },
        onSettled: (data, error, variables) => {
            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: emergencyContactKeys.list(variables.customerId) });
        },
    });
}

