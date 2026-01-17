import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, DiveCenterData } from "@/lib/api/services/settings.service";

// Query keys for dive center
export const diveCenterKeys = {
    all: ['dive-center'] as const,
    detail: () => [...diveCenterKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch dive center data
 */
export function useDiveCenter() {
    return useQuery({
        queryKey: diveCenterKeys.detail(),
        queryFn: () => settingsService.getDiveCenter(),
        staleTime: 10 * 60 * 1000, // 10 minutes - dive center data changes rarely
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        refetchOnMount: false, // Don't refetch when component remounts if data is fresh
    });
}

/**
 * Hook to update dive center data
 */
export function useUpdateDiveCenter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<DiveCenterData>) => settingsService.updateDiveCenter(data),
        onSuccess: (response) => {
            // Update the cache with the new data
            queryClient.setQueryData(diveCenterKeys.detail(), response.dive_center);
            // Optionally invalidate to ensure fresh data
            queryClient.invalidateQueries({ queryKey: diveCenterKeys.detail() });
        },
    });
}
