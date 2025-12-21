"use client";

import type { DateInputProps as AriaDateInputProps } from "react-aria-components";
import { DateInput as AriaDateInput, DateSegment as AriaDateSegment } from "react-aria-components";
import { cn } from "@/lib/utils";

interface DateInputProps extends Omit<AriaDateInputProps, "children"> {}

export const DateInput = (props: DateInputProps) => {
    return (
        <AriaDateInput
            {...props}
            className={cn(
                "flex items-center justify-center rounded-lg bg-background px-3 py-2.5 text-sm shadow-xs ring-1 ring-border ring-inset focus-within:ring-2 focus-within:ring-ring",
                typeof props.className === "string" && props.className,
            )}
        >
            {(segment) => (
                <AriaDateSegment
                    segment={segment}
                    className={cn(
                        "rounded px-1 py-0.5 text-center text-foreground tabular-nums caret-transparent focus:bg-primary focus:font-medium focus:text-primary-foreground focus:outline-none",
                        // The placeholder segment.
                        segment.isPlaceholder && "text-muted-foreground uppercase",
                        // The separator "/" segment.
                        segment.type === "literal" && "text-muted-foreground",
                    )}
                />
            )}
        </AriaDateInput>
    );
};
