"use client";

import { useEffect, useState, ReactNode } from "react";

interface NoSSRProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Component that only renders its children on the client side.
 * This completely prevents server-side rendering to avoid hydration mismatches
 * caused by browser extensions that modify the DOM.
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}