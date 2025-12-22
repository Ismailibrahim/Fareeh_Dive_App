"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { safeParseDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";

interface SafeDatePickerProps {
    selected?: Date | null | undefined;
    onChange: (date: Date | null) => void;
    [key: string]: any; // Allow all other DatePicker props
}

/**
 * SafeDatePicker - A wrapper around react-datepicker that prevents "Invalid time value" errors
 * by validating dates before passing them to the underlying DatePicker component.
 * This is critical because react-datepicker will throw errors if given invalid Date objects.
 */
export function SafeDatePicker({ selected, onChange, className, ...props }: SafeDatePickerProps) {
    // Validate and normalize the selected date - this is critical to prevent react-datepicker errors
    const safeSelected = React.useMemo(() => {
        // Handle null/undefined
        if (!selected) return null;
        
        // If it's already a Date object, validate it
        if (selected instanceof Date) {
            // Check if it's a valid date
            const isValid = !isNaN(selected.getTime());
            return isValid ? selected : null;
        }
        
        // If it's a string, parse it safely
        if (typeof selected === "string" && selected.trim()) {
            const parsed = safeParseDate(selected);
            return parsed;
        }
        
        // For any other type, return null
        return null;
    }, [selected]);

    // Handle date changes with validation
    const handleChange = React.useCallback((date: Date | null) => {
        // Only call onChange with valid dates
        if (date) {
            // Double-check it's valid before calling onChange
            if (!isNaN(date.getTime())) {
                onChange(date);
            } else {
                // If invalid, pass null instead
                onChange(null);
            }
        } else {
            onChange(null);
        }
    }, [onChange]);

    return (
        <DatePicker
            {...props}
            selected={safeSelected}
            onChange={handleChange}
            className={cn(className)}
        />
    );
}

