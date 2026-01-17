"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { diveLogService, DiveLogFormData, DiveLog } from "@/lib/api/services/dive-log.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { diveSiteService, DiveSite } from "@/lib/api/services/dive-site.service";
import { boatService, Boat } from "@/lib/api/services/boat.service";
import { userService, User } from "@/lib/api/services/user.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User as UserIcon, MapPin, Ship, Clock, CalendarIcon, Gauge, Wind, Waves, FileText, Users, Plane, Check, ChevronsUpDown } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { cn } from "@/lib/utils";
import { safeFormatDate } from "@/lib/utils/date-format";
import { format } from "date-fns";

const diveLogSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    dive_site_id: z.string().min(1, "Dive site is required"),
    dive_date: z.string().min(1, "Dive date is required"),
    entry_time: z.string().min(1, "Entry time is required"),
    exit_time: z.string().min(1, "Exit time is required"),
    total_dive_time: z.string().optional(),
    max_depth: z.string().min(1, "Max depth is required"),
    boat_id: z.string().optional(),
    dive_type: z.enum(['Recreational', 'Training', 'Technical', 'Night', 'Wreck', 'Cave', 'Drift', 'Other']),
    instructor_id: z.string().optional(),
    visibility: z.string().optional(),
    visibility_unit: z.enum(['meters', 'feet']).optional(),
    current: z.string().optional(),
    current_unit: z.enum(['knots', 'm/s']).optional(),
    tank_size: z.string().optional(),
    tank_size_unit: z.enum(['liters', 'cubic_feet']).optional(),
    gas_mix: z.enum(['Air', 'Nitrox', 'Trimix']),
    starting_pressure: z.string().optional(),
    ending_pressure: z.string().optional(),
    pressure_unit: z.enum(['bar', 'psi']).optional(),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.entry_time && data.exit_time) {
        const entry = new Date(`2000-01-01T${data.entry_time}`);
        let exit = new Date(`2000-01-01T${data.exit_time}`);
        if (exit < entry) exit.setDate(exit.getDate() + 1);
        return exit > entry;
    }
    return true;
}, { message: "Exit time must be after entry time", path: ["exit_time"] });

interface DiveLogFormProps {
    initialData?: DiveLog;
    diveLogId?: string | number;
}

const parseDate = (dateString?: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
};

const formatDateToString = (date: Date | null): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
};

export function DiveLogForm({ initialData, diveLogId }: DiveLogFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [instructors, setInstructors] = useState<User[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customerData, diveSiteData, boatData, userData] = await Promise.all([
                    customerService.getAll(),
                    diveSiteService.getAll(),
                    boatService.getAll(1, true),
                    userService.getAll(1)
                ]);
                
                setCustomers(Array.isArray(customerData) ? customerData : (customerData as any).data || []);
                setDiveSites(Array.isArray(diveSiteData) ? diveSiteData : (diveSiteData as any).data || []);
                setBoats(Array.isArray(boatData) ? boatData : (boatData as any).data || []);
                const users = Array.isArray(userData) ? userData : (userData as any).data || [];
                setInstructors(users.filter((u: User) => u.role === 'Instructor' || u.role === 'DiveMaster'));
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<z.infer<typeof diveLogSchema>>({
        resolver: zodResolver(diveLogSchema),
        defaultValues: {
            customer_id: initialData?.customer_id ? String(initialData.customer_id) : "",
            dive_site_id: initialData?.dive_site_id ? String(initialData.dive_site_id) : "",
            dive_date: initialData?.dive_date || "",
            entry_time: initialData?.entry_time || "",
            exit_time: initialData?.exit_time || "",
            total_dive_time: initialData?.total_dive_time ? String(initialData.total_dive_time) : "",
            max_depth: initialData?.max_depth ? String(initialData.max_depth) : "",
            boat_id: initialData?.boat_id ? String(initialData.boat_id) : "none",
            dive_type: initialData?.dive_type || 'Recreational',
            instructor_id: initialData?.instructor_id ? String(initialData.instructor_id) : "none",
            visibility: initialData?.visibility ? String(initialData.visibility) : "",
            visibility_unit: initialData?.visibility_unit || 'meters',
            current: initialData?.current ? String(initialData.current) : "",
            current_unit: initialData?.current_unit || 'knots',
            tank_size: initialData?.tank_size ? String(initialData.tank_size) : "",
            tank_size_unit: initialData?.tank_size_unit || 'liters',
            gas_mix: initialData?.gas_mix || 'Air',
            starting_pressure: initialData?.starting_pressure ? String(initialData.starting_pressure) : "",
            ending_pressure: initialData?.ending_pressure ? String(initialData.ending_pressure) : "",
            pressure_unit: initialData?.pressure_unit || 'bar',
            notes: initialData?.notes || "",
        },
    });

    const calculateDiveTime = () => {
        const entryTime = form.getValues('entry_time');
        const exitTime = form.getValues('exit_time');
        if (entryTime && exitTime) {
            const entry = new Date(`2000-01-01T${entryTime}`);
            let exit = new Date(`2000-01-01T${exitTime}`);
            if (exit < entry) exit.setDate(exit.getDate() + 1);
            const diffMinutes = Math.round((exit.getTime() - entry.getTime()) / 60000);
            if (diffMinutes > 0) {
                form.setValue('total_dive_time', String(diffMinutes));
            }
        }
    };

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if ((name === 'entry_time' || name === 'exit_time') && value.entry_time && value.exit_time) {
                calculateDiveTime();
            }
            if (name === 'customer_id' && value.customer_id) {
                loadCustomerDetails(value.customer_id);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const loadCustomerDetails = async (customerId: string) => {
        if (!customerId || customerId === "none") {
            setSelectedCustomer(null);
            return;
        }
        try {
            const customer = await customerService.getById(customerId);
            setSelectedCustomer(customer);
        } catch (error) {
            console.error("Failed to load customer details", error);
            setSelectedCustomer(null);
        }
    };

    // Load customer details if initialData has customer_id
    useEffect(() => {
        if (initialData?.customer_id) {
            loadCustomerDetails(String(initialData.customer_id));
        }
    }, [initialData?.customer_id]);

    async function onSubmit(data: z.infer<typeof diveLogSchema>) {
        setLoading(true);
        try {
            const payload: DiveLogFormData = {
                customer_id: Number(data.customer_id),
                dive_site_id: Number(data.dive_site_id),
                dive_date: data.dive_date,
                entry_time: data.entry_time,
                exit_time: data.exit_time,
                total_dive_time: data.total_dive_time ? Number(data.total_dive_time) : undefined,
                max_depth: Number(data.max_depth),
                boat_id: data.boat_id && data.boat_id !== "none" ? Number(data.boat_id) : undefined,
                dive_type: data.dive_type,
                instructor_id: data.instructor_id && data.instructor_id !== "none" ? Number(data.instructor_id) : undefined,
                visibility: data.visibility ? Number(data.visibility) : undefined,
                visibility_unit: data.visibility_unit,
                current: data.current ? Number(data.current) : undefined,
                current_unit: data.current_unit,
                tank_size: data.tank_size ? Number(data.tank_size) : undefined,
                tank_size_unit: data.tank_size_unit,
                gas_mix: data.gas_mix,
                starting_pressure: data.starting_pressure ? Number(data.starting_pressure) : undefined,
                ending_pressure: data.ending_pressure ? Number(data.ending_pressure) : undefined,
                pressure_unit: data.pressure_unit,
                notes: data.notes || undefined,
            };

            if (diveLogId) {
                await diveLogService.update(Number(diveLogId), payload);
            } else {
                await diveLogService.create(payload);
            }
            router.push("/dashboard/dive-logs");
            router.refresh();
        } catch (error) {
            console.error("Failed to save dive log", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Section 1: Basic Information */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-primary" />
                            Basic Information
                        </CardTitle>
                        <CardDescription className="text-xs">Customer, dive site, date and time details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <div className="flex flex-col gap-4">
                                <FormField
                                    control={form.control}
                                    name="customer_id"
                                    render={({ field }) => {
                                        const [open, setOpen] = useState(false);
                                        const [searchQuery, setSearchQuery] = useState("");
                                        
                                        const filteredCustomers = customers.filter((customer) =>
                                            customer.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                                        );
                                        
                                        const selectedCustomerName = customers.find(
                                            (c) => String(c.id) === field.value
                                        )?.full_name || "";
                                        
                                        return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Customer</FormLabel>
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between h-9",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {selectedCustomerName || "Select customer"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                        <div className="p-2">
                                                            <Input
                                                                placeholder="Search customers..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div className="max-h-[300px] overflow-auto">
                                                            {filteredCustomers.length === 0 ? (
                                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                                    No customers found.
                                                                </div>
                                                            ) : (
                                                                filteredCustomers.map((customer) => (
                                                                    <div
                                                                        key={customer.id}
                                                                        className={cn(
                                                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                            field.value === String(customer.id) && "bg-accent"
                                                                        )}
                                                                        onClick={() => {
                                                                            field.onChange(String(customer.id));
                                                                            setOpen(false);
                                                                            setSearchQuery("");
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                field.value === String(customer.id)
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {customer.full_name}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />

                                {selectedCustomer && (selectedCustomer.departure_date || selectedCustomer.departure_flight || selectedCustomer.departure_flight_time || selectedCustomer.departure_to) && (
                                    <div className="border rounded-lg p-4 bg-muted/50 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Plane className="h-4 w-4 text-primary" />
                                            <span className="font-semibold text-sm">Departure Information</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            {selectedCustomer.departure_date && (
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Date:</span>
                                                    <span className="font-medium">
                                                        {safeFormatDate(selectedCustomer.departure_date, "MMM d, yyyy", "N/A")}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedCustomer.departure_flight && (
                                                <div className="flex items-center gap-2">
                                                    <Plane className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Flight:</span>
                                                    <span className="font-medium">{selectedCustomer.departure_flight}</span>
                                                </div>
                                            )}
                                            {selectedCustomer.departure_flight_time && (
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Time:</span>
                                                    <span className="font-medium">{selectedCustomer.departure_flight_time}</span>
                                                </div>
                                            )}
                                            {selectedCustomer.departure_to && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">To:</span>
                                                    <span className="font-medium">{selectedCustomer.departure_to}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="dive_site_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Dive Site</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select dive site" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {diveSites.map((site) => (
                                                    <SelectItem key={site.id} value={String(site.id)}>
                                                        {site.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dive_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date of Dive</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={parseDate(field.value)}
                                                    onChange={(date) => field.onChange(formatDateToString(date))}
                                                    dateFormat="yyyy-MM-dd"
                                                    placeholderText="Select date"
                                                    wrapperClassName="w-full"
                                                    maxDate={new Date("2100-12-31")}
                                                    minDate={new Date("1900-01-01")}
                                                    className={cn(
                                                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] pl-9",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <FormField
                                control={form.control}
                                name="entry_time"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Entry Time</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input type="time" {...field} />
                                                <div className="grid grid-cols-7 gap-1">
                                                    {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                                                        <Button
                                                            key={time}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs px-2"
                                                            onClick={() => field.onChange(time)}
                                                        >
                                                            {time}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="exit_time"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Exit Time</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input type="time" {...field} />
                                                <div className="grid grid-cols-7 gap-1">
                                                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((time) => (
                                                        <Button
                                                            key={time}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs px-2"
                                                            onClick={() => field.onChange(time)}
                                                        >
                                                            {time}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="total_dive_time"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Total Dive Time (minutes)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Auto-calculated" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">Auto-calculated from entry/exit times</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2, 3 & 4: Dive Details, Conditions and Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Section 2: Dive Details */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-primary" />
                                Dive Details
                            </CardTitle>
                            <CardDescription className="text-xs">Depth, boat, dive type, and instructor information.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="max_depth"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Max Depth (meters)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="e.g., 18.5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="boat_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Boat</FormLabel>
                                            <Select 
                                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                                                value={field.value || "none"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select boat (optional)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {boats.map((boat) => (
                                                        <SelectItem key={boat.id} value={String(boat.id)}>
                                                            {boat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dive_type"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Dive Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Recreational">Recreational</SelectItem>
                                                    <SelectItem value="Training">Training</SelectItem>
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                    <SelectItem value="Night">Night</SelectItem>
                                                    <SelectItem value="Wreck">Wreck</SelectItem>
                                                    <SelectItem value="Cave">Cave</SelectItem>
                                                    <SelectItem value="Drift">Drift</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="instructor_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Instructor</FormLabel>
                                            <Select 
                                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                                                value={field.value || "none"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select instructor (optional)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {instructors.map((instructor) => (
                                                        <SelectItem key={instructor.id} value={String(instructor.id)}>
                                                            {instructor.full_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Conditions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Waves className="h-4 w-4 text-primary" />
                                Conditions
                            </CardTitle>
                            <CardDescription className="text-xs">Visibility and current conditions.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="visibility"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Visibility</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input type="number" step="0.1" placeholder="e.g., 20" {...field} />
                                                </FormControl>
                                                <Select
                                                    value={form.watch('visibility_unit') || 'meters'}
                                                    onValueChange={(value) => form.setValue('visibility_unit', value as 'meters' | 'feet')}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="meters">Meters</SelectItem>
                                                        <SelectItem value="feet">Feet</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="current"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Current</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input type="number" step="0.1" placeholder="e.g., 2.5" {...field} />
                                                </FormControl>
                                                <Select
                                                    value={form.watch('current_unit') || 'knots'}
                                                    onValueChange={(value) => form.setValue('current_unit', value as 'knots' | 'm/s')}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="knots">Knots</SelectItem>
                                                        <SelectItem value="m/s">m/s</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                        </div>
                    </CardContent>
                </Card>

                    {/* Section 4: Equipment */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-primary" />
                                Equipment
                            </CardTitle>
                            <CardDescription className="text-xs">Tank size, gas mix, and pressure information.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="tank_size"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Tank Size</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="e.g., 12" {...field} />
                                            </FormControl>
                                            <Select
                                                value={form.watch('tank_size_unit') || 'liters'}
                                                onValueChange={(value) => form.setValue('tank_size_unit', value as 'liters' | 'cubic_feet')}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="liters">Liters</SelectItem>
                                                    <SelectItem value="cubic_feet">Cubic Feet</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gas_mix"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Gas Mix</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-row gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Air" id="air" />
                                                    <label htmlFor="air">Air</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Nitrox" id="nitrox" />
                                                    <label htmlFor="nitrox">Nitrox</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Trimix" id="trimix" />
                                                    <label htmlFor="trimix">Trimix</label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="starting_pressure"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Starting Pressure</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input type="number" step="0.1" placeholder="e.g., 200" {...field} />
                                                </FormControl>
                                                <Select
                                                    value={form.watch('pressure_unit') || 'bar'}
                                                    onValueChange={(value) => form.setValue('pressure_unit', value as 'bar' | 'psi')}
                                                >
                                                    <SelectTrigger className="w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bar">Bar</SelectItem>
                                                        <SelectItem value="psi">PSI</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ending_pressure"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Ending Pressure</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input type="number" step="0.1" placeholder="e.g., 50" {...field} />
                                                </FormControl>
                                                <Select
                                                    value={form.watch('pressure_unit') || 'bar'}
                                                    onValueChange={(value) => form.setValue('pressure_unit', value as 'bar' | 'psi')}
                                                >
                                                    <SelectTrigger className="w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bar">Bar</SelectItem>
                                                        <SelectItem value="psi">PSI</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section 5: Notes */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Notes
                        </CardTitle>
                        <CardDescription className="text-xs">Additional information about the dive.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter any additional notes about the dive..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : (diveLogId ? "Update Dive Log" : "Create Dive Log")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

