import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerInsuranceService, CustomerInsurance, CustomerInsuranceFormData } from "@/lib/api/services/customer-insurance.service";

// Query keys for customer insurances
export const customerInsuranceKeys = {
    all: ['customer-insurances'] as const,
    lists: () => [...customerInsuranceKeys.all, 'list'] as const,
    list: (customerId?: number) => [...customerInsuranceKeys.lists(), customerId] as const,
    details: () => [...customerInsuranceKeys.all, 'detail'] as const,
    detail: (id: number) => [...customerInsuranceKeys.details(), id] as const,
};

/**
 * Hook to fetch insurance for a customer (one-to-one relationship)
 */
export function useCustomerInsurances(customerId: number | string | null) {
    return useQuery({
        queryKey: customerInsuranceKeys.list(customerId ? Number(customerId) : undefined),
        queryFn: async () => {
            const data = await customerInsuranceService.getAll(customerId ? Number(customerId) : undefined);
            // Since it's one-to-one, return the first item or null
            return Array.isArray(data) && data.length > 0 ? data[0] : null;
        },
        enabled: !!customerId,
        staleTime: 5 * 60 * 1000, // 5 minutes - related data changes less frequently
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    });
}

/**
 * Hook to fetch a single insurance by ID
 */
export function useCustomerInsurance(id: number | null) {
    return useQuery({
        queryKey: customerInsuranceKeys.detail(id!),
        queryFn: () => customerInsuranceService.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to create a new customer insurance
 */
export function useCreateCustomerInsurance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CustomerInsuranceFormData) =>
            customerInsuranceService.create(data),
        onSuccess: (data) => {
            // Invalidate insurance list for this customer
            queryClient.invalidateQueries({ queryKey: customerInsuranceKeys.list(data.customer_id) });
        },
    });
}

/**
 * Hook to update a customer insurance
 */
export function useUpdateCustomerInsurance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CustomerInsuranceFormData> }) =>
            customerInsuranceService.update(id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific insurance
            queryClient.invalidateQueries({ queryKey: customerInsuranceKeys.list(data.customer_id) });
            queryClient.invalidateQueries({ queryKey: customerInsuranceKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete a customer insurance with optimistic updates
 */
export function useDeleteCustomerInsurance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customerInsuranceService.delete(id),
        onMutate: async (id) => {
            // We need to find which customer this insurance belongs to
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: customerInsuranceKeys.all });

            // Get the insurance to find customer_id
            const insurance = queryClient.getQueryData<CustomerInsurance>(customerInsuranceKeys.detail(id));
            
            if (insurance) {
                // Optimistically set to null (one-to-one relationship)
                queryClient.setQueryData<CustomerInsurance | null>(
                    customerInsuranceKeys.list(insurance.customer_id),
                    null
                );

                // Return a context object
                return { previousInsurance: insurance, customerId: insurance.customer_id };
            }
        },
        onError: (err, id, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousInsurance && context.customerId) {
                queryClient.setQueryData(
                    customerInsuranceKeys.list(context.customerId),
                    context.previousInsurance
                );
            }
        },
        onSettled: (data, error, id, context) => {
            // Always refetch after error or success to ensure consistency
            if (context?.customerId) {
                queryClient.invalidateQueries({ queryKey: customerInsuranceKeys.list(context.customerId) });
            }
        },
    });
}

