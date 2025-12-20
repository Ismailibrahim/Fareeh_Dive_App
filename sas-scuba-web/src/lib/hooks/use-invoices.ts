import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService, Invoice, GenerateInvoiceRequest, InvoiceFilters } from "@/lib/api/services/invoice.service";

// Query keys for invoices
export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (filters?: InvoiceFilters, page?: number) => [...invoiceKeys.lists(), filters, page] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...invoiceKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of invoices
 */
export function useInvoices(filters?: InvoiceFilters, page: number = 1) {
    return useQuery({
        queryKey: invoiceKeys.list(filters, page),
        queryFn: () => invoiceService.getAll(filters, page),
        staleTime: 1 * 60 * 1000, // 1 minute - invoices change frequently
    });
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(id: number | string | null) {
    return useQuery({
        queryKey: invoiceKeys.detail(id!),
        queryFn: () => invoiceService.getById(id!),
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { booking_id: number; invoice_type?: string; invoice_date?: string; tax_percentage?: number }) =>
            invoiceService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
}

/**
 * Hook to generate invoice from booking
 */
export function useGenerateInvoiceFromBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: GenerateInvoiceRequest) => invoiceService.generateFromBooking(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['bookings'] }); // Invalidate bookings too
        },
    });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Invoice> }) =>
            invoiceService.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => invoiceService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
}

