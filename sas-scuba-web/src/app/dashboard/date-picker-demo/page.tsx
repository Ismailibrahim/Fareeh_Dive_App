"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";

// Option 1: react-datepicker (currently installed)
import DatePicker from "react-datepicker";

// Option 2: react-day-picker (already installed)
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Option 3: Native HTML5 date picker
import { Input } from "@/components/ui/input";

export default function DatePickerDemoPage() {
    const [date1, setDate1] = useState<Date | null>(null);
    const [date2, setDate2] = useState<Date | undefined>(undefined);
    const [date3, setDate3] = useState<string>("");

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Date Picker Demo" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Date Picker Options</h2>
                    <p className="text-muted-foreground">
                        Compare different date picker libraries to choose the best option for your needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Option 1: react-datepicker */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Option 1: react-datepicker</CardTitle>
                            <CardDescription>
                                Popular, feature-rich date picker with extensive customization options.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Booking Date</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                    <DatePicker
                                        selected={date1}
                                        onChange={(date) => setDate1(date)}
                                        dateFormat="PPP"
                                        placeholderText="Pick a date"
                                        wrapperClassName="w-full"
                                        className={cn(
                                            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] pl-9",
                                            !date1 && "text-muted-foreground"
                                        )}
                                    />
                                </div>
                                {date1 && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {format(date1, "PPP")}
                                    </p>
                                )}
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Pros:</strong> Feature-rich, customizable, time picker support
                                    <br />
                                    <strong>Cons:</strong> Larger bundle size, more dependencies
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Option 2: react-day-picker (shadcn/ui Calendar) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Option 2: react-day-picker</CardTitle>
                            <CardDescription>
                                Lightweight, accessible calendar component (used by shadcn/ui).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Booking Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-9 text-left font-normal relative",
                                                !date2 && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                            {date2 ? (
                                                format(date2, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date2}
                                            onSelect={setDate2}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {date2 && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {format(date2, "PPP")}
                                    </p>
                                )}
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Pros:</strong> Lightweight, accessible, matches design system
                                    <br />
                                    <strong>Cons:</strong> Less features, no time picker
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Option 3: Native HTML5 date picker */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Option 3: Native HTML5</CardTitle>
                            <CardDescription>
                                Browser-native date picker - simple and lightweight.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Booking Date</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                    <Input
                                        type="date"
                                        value={date3}
                                        onChange={(e) => setDate3(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                {date3 && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {safeFormatDate(date3, "PPP", "No date selected")}
                                    </p>
                                )}
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Pros:</strong> Zero dependencies, native browser UI
                                    <br />
                                    <strong>Cons:</strong> Browser-dependent appearance, limited customization
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Options Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Other Options Available</CardTitle>
                        <CardDescription>
                            Additional date picker libraries that can be installed if needed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Option 4: flatpickr</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Lightweight, no dependencies, great UX. Install with: <code className="bg-muted px-1 py-0.5 rounded">npm install flatpickr react-flatpickr</code>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    <strong>Best for:</strong> When you need a lightweight alternative with good mobile support
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Option 5: @mui/x-date-pickers</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Material UI date pickers. Install with: <code className="bg-muted px-1 py-0.5 rounded">npm install @mui/x-date-pickers</code>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    <strong>Best for:</strong> If you're using Material UI design system
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Feature</th>
                                        <th className="text-left p-2">react-datepicker</th>
                                        <th className="text-left p-2">react-day-picker</th>
                                        <th className="text-left p-2">Native HTML5</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-2 font-medium">Bundle Size</td>
                                        <td className="p-2">~45KB</td>
                                        <td className="p-2">~15KB</td>
                                        <td className="p-2">0KB</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-medium">Customization</td>
                                        <td className="p-2">⭐⭐⭐⭐⭐</td>
                                        <td className="p-2">⭐⭐⭐⭐</td>
                                        <td className="p-2">⭐</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-medium">Time Picker</td>
                                        <td className="p-2">✅ Yes</td>
                                        <td className="p-2">❌ No</td>
                                        <td className="p-2">❌ No</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-medium">Range Selection</td>
                                        <td className="p-2">✅ Yes</td>
                                        <td className="p-2">✅ Yes</td>
                                        <td className="p-2">❌ No</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-2 font-medium">Mobile Support</td>
                                        <td className="p-2">⭐⭐⭐⭐</td>
                                        <td className="p-2">⭐⭐⭐⭐</td>
                                        <td className="p-2">⭐⭐⭐⭐⭐</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-medium">Accessibility</td>
                                        <td className="p-2">⭐⭐⭐⭐</td>
                                        <td className="p-2">⭐⭐⭐⭐⭐</td>
                                        <td className="p-2">⭐⭐⭐⭐⭐</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}




