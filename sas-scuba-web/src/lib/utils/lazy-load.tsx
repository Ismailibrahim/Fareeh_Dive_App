import { lazy, Suspense, ComponentType } from "react";
import { PageLoader } from "@/components/ui/page-loader";

/**
 * Creates a lazy-loaded component with a default loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ReactNode
) {
    const LazyComponent = lazy(importFn);
    
    return (props: React.ComponentProps<T>) => (
        <Suspense fallback={fallback || <PageLoader variant="form" rows={3} />}>
            <LazyComponent {...props} />
        </Suspense>
    );
}

/**
 * Wrapper for lazy loading with custom fallback
 */
export function withLazyLoading<T extends ComponentType<any>>(
    Component: T,
    fallback?: React.ReactNode
) {
    return (props: React.ComponentProps<T>) => (
        <Suspense fallback={fallback || <PageLoader variant="form" rows={3} />}>
            <Component {...props} />
        </Suspense>
    );
}
