import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, Booking, BookingFormData, PaginationParams, PaginatedResponse } from "@/lib/api/services/booking.service";

// Query keys for bookings
export const bookingKeys = {
    all: ['bookings'] as const,
    lists: () => [...bookingKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...bookingKeys.lists(), params] as const,
    details: () => [...bookingKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...bookingKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of bookings
 */
export function useBookings(params?: PaginationParams) {
    return useQuery({
        queryKey: bookingKeys.list(params),
        queryFn: async () => {
            const response = await bookingService.getAll(params);
            
            // Transform response to match PaginatedResponse format
            if (response.data && Array.isArray(response.data)) {
                return {
                    data: response.data,
                    total: response.meta?.total || response.data.length,
                    per_page: params?.per_page || response.meta?.per_page || 20,
                    current_page: params?.page || response.meta?.current_page || 1,
                    last_page: response.meta?.last_page || 1,
                    from: response.meta?.from,
                    to: response.meta?.to,
                } as PaginatedResponse<Booking>;
            }
            
            // Fallback for non-paginated responses
            const bookingsList = Array.isArray(response) ? response : (response as any).data || [];
            return {
                data: bookingsList,
                total: bookingsList.length,
                per_page: params?.per_page || 20,
                current_page: params?.page || 1,
                last_page: 1,
            } as PaginatedResponse<Booking>;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes - bookings change frequently
    });
}

/**
 * Hook to fetch a single booking by ID
 */
export function useBooking(id: number | string | null) {
    return useQuery({
        queryKey: bookingKeys.detail(id!),
        queryFn: () => bookingService.getById(id!),
        enabled: !!id, // Only fetch if id is provided
        staleTime: 5 * 60 * 1000, // 5 minutes - booking data persists longer
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        refetchOnMount: false, // Don't refetch when component remounts if data is fresh
    });
}

/**
 * Hook to create a new booking
 */
export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BookingFormData) => bookingService.create(data),
        onSuccess: () => {
            // Invalidate bookings list to refetch
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
        },
    });
}

/**
 * Hook to update a booking
 */
export function useUpdateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<BookingFormData> }) =>
            bookingService.update(id, data),
        onSuccess: (data, variables) => {
            // Invalidate both the list and the specific booking
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
        },
    });
}

/**
 * Hook to delete a booking
 */
export function useDeleteBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => bookingService.delete(id),
        onSuccess: () => {
            // Invalidate bookings list to refetch
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
        },
    });
}
