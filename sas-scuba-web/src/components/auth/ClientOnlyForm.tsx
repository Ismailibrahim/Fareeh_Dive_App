"use client";

import { useEffect, useState, ReactNode } from "react";

interface ClientOnlyFormProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function ClientOnlyForm({ children, fallback }: ClientOnlyFormProps) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return fallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
}