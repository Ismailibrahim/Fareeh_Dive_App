import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, Booking, BookingFormData } from "@/lib/api/services/booking.service";

// Query keys for bookings
export const bookingKeys = {
    all: ['bookings'] as const,
    lists: () => [...bookingKeys.all, 'list'] as const,
    list: (page?: number) => [...bookingKeys.lists(), page] as const,
    details: () => [...bookingKeys.all, 'detail'] as const,
    detail: (id: number | string) => [...bookingKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of bookings
 */
export function useBookings(page: number = 1) {
    return useQuery({
        queryKey: bookingKeys.list(page),
        queryFn: () => bookingService.getAll(page),
        staleTime: 1 * 60 * 1000, // 1 minute - bookings change frequently
    });
}

/**
 * Hook to fetch a single booking by ID
 */
export function useBooking(id: number | string | null) {
    return useQuery({
        queryKey: bookingKeys.detail(id!),
        queryFn: () => bookingService.getById(id!),
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // 2 minutes
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
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
        },
    });
}

