import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerCertificationService, CustomerCertification, CustomerCertificationFormData } from "@/lib/api/services/customer-certification.service";

// Query keys for customer certifications
export const customerCertificationKeys = {
    all: ['customer-certifications'] as const,
    lists: () => [...customerCertificationKeys.all, 'list'] as const,
    list: (customerId?: number) => [...customerCertificationKeys.lists(), customerId] as const,
    details: () => [...customerCertificationKeys.all, 'detail'] as const,
    detail: (id: number) => [...customerCertificationKeys.details(), id] as const,
};

/**
 * Hook to fetch certification for a customer (one-to-one relationship)
 */
export function useCustomerCertifications(customerId: number | string | null) {
    return useQuery({
        queryKey: customerCertificationKeys.list(customerId ? Number(customerId) : undefined),
        queryFn: async () => {
            const data = await customerCertificationService.getAll(customerId ? Number(customerId) : undefined);
            // Since it's one-to-one, return the first item or null
            return Array.isArray(data) && data.length > 0 ? data[0] : null;
        },
        enabled: !!customerId,
        staleTime: 5 * 60 * 1000, // 5 minutes - related data changes less frequently
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    });
}

/**
 * Hook to fetch a single certification by ID
 */
export function useCustomerCertification(id: number | null) {
    return useQuery({
        queryKey: customerCertificationKeys.detail(id!),
        queryFn: () => customerCertificationService.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to create a new customer certification
 */
export function useCreateCustomerCertification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CustomerCertificationFormData) =>
            customerCertificationService.create(data),
        onSuccess: (data) => {
            // Invalidate certifications list for this customer
            queryClient.invalidateQueries({ queryKey: customerCertificationKeys.list(data.customer_id) });
        },
    });
}

/**
 * Hook to update a customer certification
 */
export function useUpdateCustomerCertification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CustomerCertificationFormData> }) =>
            customerCertificationService.update(id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific certification
            queryClient.invalidateQueries({ queryKey: customerCertificationKeys.list(data.customer_id) });
            queryClient.invalidateQueries({ queryKey: customerCertificationKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete a customer certification with optimistic updates
 */
export function useDeleteCustomerCertification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customerCertificationService.delete(id),
        onMutate: async (id) => {
            // We need to find which customer this certification belongs to
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: customerCertificationKeys.all });

            // Get the certification to find customer_id
            const cert = queryClient.getQueryData<CustomerCertification>(customerCertificationKeys.detail(id));
            
            if (cert) {
                // Optimistically set to null (one-to-one relationship)
                queryClient.setQueryData<CustomerCertification | null>(
                    customerCertificationKeys.list(cert.customer_id),
                    null
                );

                // Return a context object
                return { previousCertification: cert, customerId: cert.customer_id };
            }
        },
        onError: (err, id, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousCertification && context.customerId) {
                queryClient.setQueryData(
                    customerCertificationKeys.list(context.customerId),
                    context.previousCertification
                );
            }
        },
        onSettled: (data, error, id, context) => {
            // Always refetch after error or success to ensure consistency
            if (context?.customerId) {
                queryClient.invalidateQueries({ queryKey: customerCertificationKeys.list(context.customerId) });
            }
        },
    });
}

