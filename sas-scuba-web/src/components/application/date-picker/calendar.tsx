"use client";

import type { PropsWithChildren } from "react";
import { Fragment, useContext, useEffect, useState } from "react";
import * as React from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { CalendarProps as AriaCalendarProps, DateValue } from "react-aria-components";
import {
    Calendar as AriaCalendar,
    CalendarContext as AriaCalendarContext,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridBody as AriaCalendarGridBody,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    CalendarStateContext,
    Heading as AriaHeading,
    useSlottedContext,
} from "react-aria-components";
import { Button as AriaButton } from "react-aria-components";
import { ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarCell } from "./cell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export const CalendarContextProvider = ({ children }: PropsWithChildren) => {
    const [value, onChange] = useState<DateValue | null>(null);
    const [focusedValue, onFocusChange] = useState<DateValue | undefined>();

    return <AriaCalendarContext.Provider value={{ value, onChange, focusedValue, onFocusChange }}>{children}</AriaCalendarContext.Provider>;
};


interface CalendarProps extends AriaCalendarProps<DateValue> {
    /** The dates to highlight. */
    highlightedDates?: DateValue[];
    /** Ref callback to get the current calendar state value */
    stateRef?: React.MutableRefObject<{ getValue: () => DateValue | null | undefined } | null>;
}

const TodayButton = () => {
    const state = useContext(CalendarStateContext);
    
    if (!state) return null;

    const handleClick = () => {
        const todayDate = today(getLocalTimeZone());
        state.setFocusedDate(todayDate);
        state.setValue(todayDate);
    };

    return (
        <AriaButton
            slot={null}
            onPress={handleClick}
            className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
                "h-8 px-3 py-2",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
        >
            Today
        </AriaButton>
    );
};

const MonthYearSelector = () => {
    const state = useContext(CalendarStateContext);
    
    if (!state) return null;

    const visibleRange = state.visibleRange;
    const currentDate = visibleRange.start;
    const currentMonth = currentDate.month;
    const currentYear = currentDate.year;

    const [yearInput, setYearInput] = useState<string>(currentYear.toString());

    // Update year input when calendar month/year changes externally (e.g., via arrows)
    useEffect(() => {
        setYearInput(currentYear.toString());
    }, [currentYear]);

    // Generate months
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleMonthChange = (monthValue: string) => {
        const newMonth = parseInt(monthValue);
        const newDate = currentDate.set({ month: newMonth });
        state.setFocusedDate(newDate);
    };

    const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === "" || /^\d+$/.test(value)) {
            setYearInput(value);
        }
    };

    const handleYearInputBlur = () => {
        const yearValue = parseInt(yearInput);
        const currentYearValue = today(getLocalTimeZone()).year;
        const minYear = currentYearValue - 100;
        const maxYear = currentYearValue + 100;
        
        // Validate year range
        if (!isNaN(yearValue) && yearValue >= minYear && yearValue <= maxYear) {
            const newDate = currentDate.set({ year: yearValue });
            state.setFocusedDate(newDate);
        } else {
            // Reset to current year if invalid
            setYearInput(currentYear.toString());
        }
    };

    const handleYearInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 w-[120px] text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {months.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="text"
                inputMode="numeric"
                value={yearInput}
                onChange={handleYearInputChange}
                onBlur={handleYearInputBlur}
                onKeyDown={handleYearInputKeyDown}
                className="h-8 w-[80px] text-sm text-center"
                placeholder="Year"
            />
        </div>
    );
};

const YearInput = () => {
    const state = useContext(CalendarStateContext);
    
    if (!state) return null;

    const visibleRange = state.visibleRange;
    const currentDate = visibleRange.start;
    const currentYear = currentDate.year;

    const [yearInput, setYearInput] = useState<string>(currentYear.toString());

    // Update year input when calendar year changes externally (e.g., via arrows)
    useEffect(() => {
        setYearInput(currentYear.toString());
    }, [currentYear]);

    const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === "" || /^\d+$/.test(value)) {
            setYearInput(value);
        }
    };

    const handleYearInputBlur = () => {
        const yearValue = parseInt(yearInput);
        const currentYearValue = today(getLocalTimeZone()).year;
        const minYear = currentYearValue - 100;
        const maxYear = currentYearValue + 100;
        
        // Validate year range
        if (!isNaN(yearValue) && yearValue >= minYear && yearValue <= maxYear) {
            const newDate = currentDate.set({ year: yearValue });
            state.setFocusedDate(newDate);
        } else {
            // Reset to current year if invalid
            setYearInput(currentYear.toString());
        }
    };

    const handleYearInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    };

    return (
        <Input
            type="text"
            inputMode="numeric"
            value={yearInput}
            onChange={handleYearInputChange}
            onBlur={handleYearInputBlur}
            onKeyDown={handleYearInputKeyDown}
            className="h-8 w-[80px] text-sm text-center"
            placeholder="Year"
        />
    );
};

export const Calendar = ({ highlightedDates, className, stateRef, ...props }: CalendarProps) => {
    const context = useSlottedContext(AriaCalendarContext)!;

    const ContextWrapper = context ? Fragment : CalendarContextProvider;

    // Internal component to expose state getter via ref
    const StateExposer = () => {
        const state = useContext(CalendarStateContext);
        
        // Update the ref with a getter function when state is available
        React.useEffect(() => {
            if (stateRef && state) {
                stateRef.current = {
                    getValue: () => state.value as DateValue | null | undefined
                };
            }
            return () => {
                if (stateRef) {
                    stateRef.current = null;
                }
            };
        }, [state, stateRef]);
        
        return null;
    };

    return (
        <ContextWrapper>
            <AriaCalendar {...props} className={(state) => cn("flex flex-col gap-3", typeof className === "function" ? className(state) : className)}>
                <header className="flex items-center justify-between p-3">
                    <AriaButton
                        slot="previous"
                        className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all",
                            "size-8 p-0",
                            "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </AriaButton>
                    <AriaHeading className="text-sm font-semibold text-foreground" />
                    <AriaButton
                        slot="next"
                        className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all",
                            "size-8 p-0",
                            "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </AriaButton>
                </header>

                <div className="flex gap-3 px-3">
                    <YearInput />
                    <TodayButton />
                </div>

                <AriaCalendarGrid weekdayStyle="short" className="w-max px-3 pt-3 pb-3">
                    <AriaCalendarGridHeader className="border-b border-border">
                        {(day) => (
                            <AriaCalendarHeaderCell className="p-0">
                                <div className="flex size-10 items-center justify-center text-sm font-medium text-muted-foreground">{day.slice(0, 2)}</div>
                            </AriaCalendarHeaderCell>
                        )}
                    </AriaCalendarGridHeader>
                    <AriaCalendarGridBody className="[&_td]:p-0 [&_tr]:border-b [&_tr]:border-border [&_tr:last-of-type]:border-none">
                        {(date) => (
                            <CalendarCell date={date} isHighlighted={highlightedDates?.some((highlightedDate) => date.compare(highlightedDate) === 0)} />
                        )}
                    </AriaCalendarGridBody>
                </AriaCalendarGrid>
                {stateRef && <StateExposer />}
            </AriaCalendar>
        </ContextWrapper>
    );
};
