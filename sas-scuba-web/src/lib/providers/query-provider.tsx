"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: data is considered fresh for 5 minutes
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        // Cache time: data stays in cache for 10 minutes after last use
                        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
                        // Retry failed requests 1 time
                        retry: 1,
                        // Refetch on window focus (useful for keeping data fresh)
                        refetchOnWindowFocus: false,
                        // Don't refetch on reconnect by default (can be overridden per query)
                        refetchOnReconnect: true,
                    },
                    mutations: {
                        // Retry failed mutations 0 times (mutations shouldn't retry)
                        retry: 0,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

