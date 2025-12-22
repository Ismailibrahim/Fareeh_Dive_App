"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { parseDate, CalendarDate, getLocalTimeZone, today, isSameDay } from "@internationalized/date";
import { Calendar } from "@/components/application/date-picker/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DatePickerProps {
    /** The current value as a string (YYYY-MM-DD format) */
    value?: string;
    /** Callback when value changes, receives string (YYYY-MM-DD format) */
    onChange?: (value: string | undefined) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Minimum selectable date as string (YYYY-MM-DD format) */
    minDate?: string;
    /** Maximum selectable date as string (YYYY-MM-DD format) */
    maxDate?: string;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Additional className */
    className?: string;
}

/**
 * Converts a string date (YYYY-MM-DD) to CalendarDate
 */
function stringToCalendarDate(dateString: string | undefined): CalendarDate | null {
    if (!dateString) return null;
    try {
        return parseDate(dateString);
    } catch {
        return null;
    }
}

/**
 * Converts a CalendarDate to string (YYYY-MM-DD format)
 */
function calendarDateToString(date: CalendarDate | null | undefined): string | undefined {
    if (!date) return undefined;
    const year = date.year;
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${year}-${month}-${day}`;
}


export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    minDate,
    maxDate,
    disabled = false,
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const dateValue = React.useMemo(() => stringToCalendarDate(value), [value]);
    const minDateValue = React.useMemo(() => stringToCalendarDate(minDate), [minDate]);
    const maxDateValue = React.useMemo(() => stringToCalendarDate(maxDate), [maxDate]);
    const todayValue = today(getLocalTimeZone());

    const highlightedDates = React.useMemo(() => {
        const dates: CalendarDate[] = [todayValue];
        if (dateValue && !isSameDay(dateValue, todayValue)) {
            dates.push(dateValue);
        }
        return dates;
    }, [dateValue, todayValue]);

    const [tempValue, setTempValue] = React.useState<CalendarDate | undefined>(dateValue || undefined);

    // Update temp value when dateValue changes externally or when popover opens
    React.useEffect(() => {
        if (open) {
            setTempValue(dateValue || undefined);
        }
    }, [dateValue, open]);

    // Ref to get the current calendar state value
    const calendarStateRef = React.useRef<{ getValue: () => CalendarDate | null | undefined } | null>(null);

    const handleCalendarChange = (selectedDate: CalendarDate | null | undefined) => {
        setTempValue(selectedDate || undefined);
    };

    const handleApply = () => {
        // Try to get the latest value directly from the calendar state
        // This includes changes from DateInput
        let latestValue: CalendarDate | undefined = tempValue || dateValue || undefined;
        
        if (calendarStateRef.current?.getValue) {
            const stateValue = calendarStateRef.current.getValue();
            if (stateValue !== null && stateValue !== undefined) {
                latestValue = stateValue;
            } else if (stateValue === null) {
                latestValue = undefined;
            }
        }
        
        const stringValue = calendarDateToString(latestValue);
        onChange?.(stringValue);
        setOpen(false);
    };

    const handleCancel = () => {
        setTempValue(dateValue || undefined);
        setOpen(false);
    };

    const displayValue = value ? (() => {
        try {
            const date = new Date(value + "T00:00:00");
            if (isNaN(date.getTime())) {
                return placeholder;
            }
            return format(date, "PPP");
        } catch {
            return placeholder;
        }
    })() : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full pl-9 text-left font-normal relative",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    {displayValue}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="flex flex-col">
                    <Calendar
                        value={tempValue}
                        onChange={(date) => {
                            handleCalendarChange(date);
                        }}
                        stateRef={calendarStateRef}
                        minValue={minDateValue || undefined}
                        maxValue={maxDateValue || undefined}
                        highlightedDates={highlightedDates}
                    />
                    <div className="grid grid-cols-2 gap-3 border-t border-border p-4">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApply}
                            className="h-9"
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

