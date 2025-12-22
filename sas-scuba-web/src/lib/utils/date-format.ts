import { format, parseISO, isValid } from "date-fns";

/**
 * Validates if a date string is valid
 * @param dateString - The date string to validate
 * @returns True if the date is valid, false otherwise
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
    if (!dateString || typeof dateString !== "string") {
        return false;
    }
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

/**
 * Safely creates a Date object from a date string
 * Uses date-fns parseISO for better reliability with ISO dates
 * @param dateString - The date string to parse
 * @returns Date object or null if invalid
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) {
        return null;
    }

    try {
        // Try parseISO first (more reliable for ISO date strings)
        // This handles ISO 8601 format dates better than new Date()
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
            try {
                const parsed = parseISO(dateString);
                if (isValid(parsed)) {
                    return parsed;
                }
            } catch {
                // Fall through to regular Date parsing
            }
        }
        
        // Fallback to regular Date parsing
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    } catch (error) {
        return null;
    }
}

/**
 * Safely format a date string, returning a fallback if the date is invalid or null
 * @param dateString - The date string to format (can be null, undefined, or empty)
 * @param formatString - The format string for date-fns format function
 * @param fallback - The fallback text to return if date is invalid (default: "N/A")
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
    dateString: string | null | undefined,
    formatString: string,
    fallback: string = "N/A"
): string {
    const date = safeParseDate(dateString);
    if (!date) {
        return fallback;
    }

    try {
        return format(date, formatString);
    } catch (error) {
        console.error("Error formatting date:", error, "Date string:", dateString, "Format:", formatString);
        return fallback;
    }
}

/**
 * Safely compares two date strings
 * @param dateString1 - First date string
 * @param dateString2 - Second date string (defaults to current date if not provided)
 * @returns Comparison result: -1 if date1 < date2, 0 if equal, 1 if date1 > date2, or null if either is invalid
 */
export function safeCompareDates(
    dateString1: string | null | undefined,
    dateString2?: string | null | undefined
): number | null {
    const date1 = safeParseDate(dateString1);
    if (!date1) {
        return null;
    }

    const date2 = dateString2 !== undefined ? safeParseDate(dateString2) : new Date();
    if (!date2) {
        return null;
    }

    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
}

