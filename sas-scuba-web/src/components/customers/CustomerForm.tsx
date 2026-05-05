"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { customerService, CustomerFormData } from "@/lib/api/services/customer.service";
import { nationalityService, Nationality } from "@/lib/api/services/nationality.service";
import { countryService, Country } from "@/lib/api/services/country.service";
import { agentService, Agent } from "@/lib/api/services/agent.service";
import { priceListService, PriceList } from "@/lib/api/services/price-list.service";
import { equipmentTypeService, EquipmentType } from "@/lib/api/services/equipment-type.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, CreditCard, Flag, MapPin, Globe, Plane, Building2, Receipt, Map, BadgeInfo, PlaneTakeoff, SaveAll, Anchor, PhoneCall, ShieldCheck, FileText, Plus, Trash2, Home } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fillPDF, CustomerData } from "@/lib/utils/pdf-filler";

const customerSchema = z.object({
    // Basic Info
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address").or(z.literal("")).optional(),
    phone: z.string().optional(),
    gender: z.string().optional(),
    date_of_birth: z.string().optional(),
    
    // Identity
    passport_no: z.string().optional(),
    nationality: z.string().optional(),
    
    // Address
    address: z.string().optional(),
    city: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
    agent_id: z.string().optional().or(z.literal("")),
    price_list_id: z.string().optional().or(z.literal("")),
    
    // Departure
    departure_date: z.string().optional(),
    departure_flight: z.string().optional(),
    departure_flight_time: z.string().optional(),
    departure_to: z.string().optional(),

    // Emergency Contacts
    emergency_contacts: z.array(z.object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        phone_1: z.string().optional(),
        email: z.string().email().or(z.literal("")).optional(),
        is_primary: z.boolean().optional()
    })).optional(),

    // Certifications
    certifications: z.array(z.object({
        certification_name: z.string().optional(),
        certification_no: z.string().optional(),
        expiry_date: z.string().optional(),
    })).optional(),

    // Insurance
    insurance: z.object({
        insurance_provider: z.string().optional(),
        insurance_no: z.string().optional(),
        insurance_hotline_no: z.string().optional(),
        expiry_date: z.string().optional(),
    }).optional(),

    // Accommodation
    accommodation: z.object({
        name: z.string().optional(),
        contact_no: z.string().optional(),
        address: z.string().optional(),
    }).optional(),

    // Medical Forms (Checkboxes)
    medical_forms: z.record(z.string(), z.boolean()).optional(),

    // Equipment Request Items mapped dynamically below
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    initialData?: Customer | null;
}

export function CustomerForm({ initialData }: CustomerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    
    // Dropdown Data States
    const [nationalities, setNationalities] = useState<Nationality[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    
    // Equipment Request State
    const [equipmentSelections, setEquipmentSelections] = useState<Record<string, { rent: boolean, own: boolean, note: string }>>({});
    const [equipmentReturnDate, setEquipmentReturnDate] = useState<string>("");
    const [equipmentNotes, setEquipmentNotes] = useState<string>("");

    // PDF Generation State
    const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

    const pdfs = [
        {
            name: "Diver Medical Form",
            filename: "10346 Diver Medical Form.pdf",
            description: "Physical health and medical history statement"
        },
        {
            name: "Release of Liability",
            filename: "10072 Release of Liability_Assumption of Risk_Non-agency Acknowledgment Form – General Training.pdf",
            description: "Liability release and assumption of risk agreement"
        },
        {
            name: "Safe Diving Practices",
            filename: "10060 Standard Safe Diving Practices Statement of Understanding.pdf",
            description: "Acknowledgment of safe diving practices and standards"
        }
    ];

    const handleGeneratePdf = async (filename: string) => {
        setGeneratingPdf(filename);
        try {
            const currentValues = form.getValues();
            const customerDataForPdf: CustomerData = {
                full_name: currentValues.full_name || "",
                date_of_birth: currentValues.date_of_birth || "",
                gender: currentValues.gender || "",
                nationality: currentValues.nationality || "",
                passport_no: currentValues.passport_no || "",
                address: currentValues.address || "",
                city: currentValues.city || "",
                country: currentValues.country || "",
                email: currentValues.email || "",
                phone: currentValues.phone || ""
            };
            
            const success = await fillPDF(`/${filename}`, customerDataForPdf);
            if (success) {
                toast.success("PDF generated successfully!");
            } else {
                toast.error("Failed to generate PDF. File might be missing.");
            }
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("An error occurred during PDF generation.");
        } finally {
            setGeneratingPdf(null);
        }
    };

    useEffect(() => {
        Promise.all([
            nationalityService.getAll().then(setNationalities).catch(console.error),
            countryService.getAll().then(setCountries).catch(console.error),
            agentService.getAll({ status: 'Active' }).then(res => setAgents(Array.isArray(res) ? res : (res as any).data || [])).catch(console.error),
            priceListService.getAll(1, 100).then(res => setPriceLists(res.data || [])).catch(console.error),
            equipmentTypeService.getAll(true).then(setEquipmentTypes).catch(console.error)
        ]);
    }, []);

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            full_name: initialData?.full_name || "", 
            email: initialData?.email || "", 
            phone: initialData?.phone || "", 
            address: initialData?.address || "", 
            city: initialData?.city || "", 
            zip_code: initialData?.zip_code || "", 
            country: initialData?.country || "",
            passport_no: initialData?.passport_no || "", 
            nationality: initialData?.nationality || "", 
            gender: initialData?.gender || "", 
            date_of_birth: initialData?.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : "",
            departure_date: initialData?.departure_date ? new Date(initialData.departure_date).toISOString().split('T')[0] : "", 
            departure_flight: initialData?.departure_flight || "", 
            departure_flight_time: initialData?.departure_flight_time ? initialData.departure_flight_time.substring(0,5) : "", 
            departure_to: initialData?.departure_to || "",
            agent_id: initialData?.agent_id ? String(initialData.agent_id) : "", 
            price_list_id: initialData?.price_list_id ? String(initialData.price_list_id) : "",
            emergency_contacts: initialData?.emergency_contacts && initialData.emergency_contacts.length > 0 ? initialData.emergency_contacts : [
                { name: "", relationship: "", phone_1: "", email: "", is_primary: true },
                { name: "", relationship: "", phone_1: "", email: "", is_primary: false }
            ],
            certifications: (initialData as any)?.certification && (initialData as any).certification.length > 0 ? (initialData as any).certification : [
                { certification_name: "", certification_no: "", expiry_date: "" }
            ],
            insurance: (initialData as any)?.insurance || { insurance_provider: "", insurance_no: "", insurance_hotline_no: "", expiry_date: "" },
            accommodation: (initialData as any)?.accommodation || { name: "", contact_no: "", address: "" },
            medical_forms: { liability_waiver: false, medical_statement: false, medical_certificate: false },
        },
    });

    // Load equipment and medical forms if editing
    useEffect(() => {
        if (initialData && initialData.id) {
            // Load Equipment Request
            customerService.getEquipmentRequest(initialData.id).then((res) => {
                const basket = res.data;
                if (basket && basket.booking_equipment) {
                    const selections: Record<string, { rent: boolean, own: boolean, note: string }> = {};
                    basket.booking_equipment.forEach((eq: any) => {
                        if (eq.customer_equipment_type) {
                            selections[eq.customer_equipment_type] = {
                                rent: eq.equipment_source === 'Center',
                                own: eq.equipment_source === 'Customer Own',
                                note: eq.customer_equipment_notes || ""
                            };
                        }
                    });
                    setEquipmentSelections(selections);
                    if (basket.expected_return_date) setEquipmentReturnDate(basket.expected_return_date);
                    if (basket.notes) setEquipmentNotes(basket.notes);
                }
            }).catch(console.error);

            // Fetch actual medical forms from backend if implemented, else leave defaults
            // (Assumes a new endpoint or nested relation to fetch them)
        }
    }, [initialData]);

    const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({
        control: form.control,
        name: "certifications"
    });

    // Auto-switch tabs if validation fails on a hidden tab
    useEffect(() => {
        const errors = form.formState.errors;
        if (Object.keys(errors).length > 0) {
            if (errors.full_name || errors.email || errors.phone || errors.gender || errors.date_of_birth) setActiveTab("basic");
            else if (errors.passport_no || errors.nationality) setActiveTab("identity");
            else if (errors.address || errors.city || errors.zip_code || errors.country) setActiveTab("address");
            else if (errors.departure_date || errors.departure_flight || errors.departure_flight_time || errors.departure_to) setActiveTab("departure");
        }
    }, [form.formState.errors]);

    const handleEquipmentChange = (typeName: string, field: 'rent' | 'own' | 'note', value: boolean | string) => {
        setEquipmentSelections(prev => {
            const current = prev[typeName] || { rent: false, own: false, note: "" };
            const next = { ...current, [field]: value };
            
            // Mutual exclusivity for checkboxes
            if (field === 'rent' && value) next.own = false;
            if (field === 'own' && value) next.rent = false;
            
            return { ...prev, [typeName]: next };
        });
    };

    const submitData = async (data: CustomerFormValues, saveAndAddAnother: boolean = false) => {
        setLoading(true);
        try {
            // Build Equipment Payload
            const equipmentItems = [];
            for (const [typeName, selection] of Object.entries(equipmentSelections)) {
                if (selection.rent || selection.own) {
                    equipmentItems.push({
                        equipment_type_name: typeName,
                        rent: selection.rent,
                        own: selection.own,
                        note: selection.note
                    });
                }
            }

            const payload: CustomerFormData = {
                ...data,
                email: data.email || undefined,
                agent_id: data.agent_id && data.agent_id !== "none" ? Number(data.agent_id) : undefined,
                price_list_id: data.price_list_id && data.price_list_id !== "none" ? Number(data.price_list_id) : undefined,
                equipment_request: equipmentItems.length > 0 ? {
                    expected_return_date: equipmentReturnDate || null,
                    notes: equipmentNotes || null,
                    items: equipmentItems
                } : undefined
            };
            
            if (initialData && initialData.id) {
                await customerService.update(initialData.id, payload);
                toast.success("Customer updated successfully!");
                router.push(`/dashboard/customers/${initialData.id}`);
                router.refresh();
            } else {
                const newCustomer = await customerService.create(payload);
                toast.success("Customer created successfully!");
                
                if (saveAndAddAnother) {
                    form.reset();
                    setEquipmentSelections({});
                    setEquipmentReturnDate("");
                    setEquipmentNotes("");
                    setActiveTab("basic");
                    setTimeout(() => document.getElementById("full_name")?.focus(), 100);
                } else {
                    router.push(`/dashboard/customers/${newCustomer.id}`);
                    router.refresh();
                }
            }
        } catch (error) {
            console.error("Failed to save customer", error);
            toast.error("Failed to create customer. Please check the fields.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form className="flex flex-col h-full space-y-0" onSubmit={(e) => e.preventDefault()}>
                
                {/* TOP COMPACT SECTION - Absolute essentials */}
                <Card className="mb-6 border-primary/20 shadow-sm">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="full_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-primary font-semibold">Full Name *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="full_name" placeholder="John Doe" className="pl-9 h-11" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="email@example.com" className="pl-9 h-11" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="+1 (555) 000-0000" className="pl-9 h-11" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                {/* TABBED SECTIONS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Updated grid to 8 columns and wrap to multiple lines on smaller screens */}
                    <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg justify-start border shadow-inner">
                        <TabsTrigger value="basic" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><BadgeInfo className="w-4 h-4" /> Personal</TabsTrigger>
                        <TabsTrigger value="address" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><Map className="w-4 h-4" /> Address</TabsTrigger>
                        <TabsTrigger value="billing" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><Receipt className="w-4 h-4" /> Billing</TabsTrigger>
                        <TabsTrigger value="equipment" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><Anchor className="w-4 h-4" /> Equipment</TabsTrigger>
                        <TabsTrigger value="certs" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><ShieldCheck className="w-4 h-4" /> Certificates</TabsTrigger>
                        <TabsTrigger value="emergency" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><PhoneCall className="w-4 h-4" /> Emergency</TabsTrigger>
                        <TabsTrigger value="travel" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><PlaneTakeoff className="w-4 h-4" /> Travel</TabsTrigger>
                        <TabsTrigger value="insurance" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><ShieldCheck className="w-4 h-4" /> Insurance</TabsTrigger>
                        <TabsTrigger value="legal" className="flex-1 min-w-[120px] py-2.5 flex gap-2"><FileText className="w-4 h-4" /> Medical/Legal</TabsTrigger>
                    </TabsList>

                    <Card className="border-none shadow-none bg-transparent">
                        <CardContent className="p-0">
                            
                            {/* TAB: BASIC INFO & IDENTITY */}
                            <TabsContent value="basic" className="mt-0 outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                    <FormField control={form.control} name="gender" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                                        <FormItem className="flex flex-col justify-end">
                                            <FormLabel>Date of Birth</FormLabel>
                                            <FormControl>
                                                <div className="h-11 flex items-center w-full">
                                                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" maxDate={new Date().toISOString().split('T')[0]} minDate="1900-01-01" />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="passport_no" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Passport Number</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="A12345678" className="pl-9 h-11" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="nationality" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nationality</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Flag className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                        <SelectTrigger className="pl-9 h-11"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    {nationalities.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                            </TabsContent>

                            {/* TAB: ADDRESS & BILLING */}
                            <TabsContent value="address" className="mt-0 outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Street Address</FormLabel>
                                            <FormControl>
                                                <div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="123 Ocean Drive" className="pl-9 h-11" {...field} /></div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="city" render={({ field }) => (
                                        <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Miami" className="h-11" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="zip_code" render={({ field }) => (
                                        <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input placeholder="33101" className="h-11" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="country" render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Country</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <div className="relative"><Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9 h-11"><SelectValue placeholder="Select country" /></SelectTrigger></div>
                                                </FormControl>
                                                <SelectContent>
                                                    {countries.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                            </TabsContent>

                            {/* TAB: BILLING */}
                            <TabsContent value="billing" className="mt-0 outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                    <FormField control={form.control} name="agent_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Linked Agent</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                                                <FormControl>
                                                    <div className="relative"><Building2 className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9 h-11"><SelectValue placeholder="Select an agent" /></SelectTrigger></div>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None (Direct Customer)</SelectItem>
                                                    {agents.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.agent_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="price_list_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Default Price List</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
                                                <FormControl>
                                                    <div className="relative"><Receipt className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9 h-11"><SelectValue placeholder="Select price list" /></SelectTrigger></div>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Default Standard Prices</SelectItem>
                                                    {priceLists.map(pl => <SelectItem key={pl.id} value={String(pl.id)}>{pl.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                            </TabsContent>

                            {/* TAB: EQUIPMENT */}
                            <TabsContent value="equipment" className="mt-0 outline-none">
                                <div className="bg-card p-6 rounded-lg border shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[30%]">Equipment Item</TableHead>
                                                <TableHead className="text-center w-[15%]">Rent</TableHead>
                                                <TableHead className="text-center w-[15%]">Own</TableHead>
                                                <TableHead>Sizes / Brand / Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {equipmentTypes.map((type) => {
                                                const sel = equipmentSelections[type.name] || { rent: false, own: false, note: "" };
                                                return (
                                                    <TableRow key={type.name}>
                                                        <TableCell className="font-medium">{type.name}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox 
                                                                checked={sel.rent} 
                                                                onCheckedChange={(c) => handleEquipmentChange(type.name, 'rent', !!c)} 
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox 
                                                                checked={sel.own} 
                                                                onCheckedChange={(c) => handleEquipmentChange(type.name, 'own', !!c)} 
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                placeholder="e.g. Size M, Scubapro..." 
                                                                value={sel.note} 
                                                                onChange={(e) => handleEquipmentChange(type.name, 'note', e.target.value)} 
                                                                disabled={!sel.rent && !sel.own}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Expected Return Date</label>
                                            <div className="h-11">
                                                <DatePicker value={equipmentReturnDate} onChange={setEquipmentReturnDate} placeholder="Pick a date" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">General Equipment Notes</label>
                                            <Textarea value={equipmentNotes} onChange={e => setEquipmentNotes(e.target.value)} placeholder="Add any general notes..." className="resize-none" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: CERTIFICATES */}
                            <TabsContent value="certs" className="mt-0 outline-none">
                                <div className="space-y-4">
                                    {certFields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-card p-6 rounded-lg border shadow-sm items-end relative">
                                            {certFields.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500" onClick={() => removeCert(index)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <div className="md:col-span-4">
                                                <FormField control={form.control} name={`certifications.${index}.certification_name`} render={({ field }) => (
                                                    <FormItem><FormLabel>Agency & Level</FormLabel><FormControl><Input placeholder="PADI Open Water" className="h-11" {...field} /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="md:col-span-4">
                                                <FormField control={form.control} name={`certifications.${index}.certification_no`} render={({ field }) => (
                                                    <FormItem><FormLabel>Diver No.</FormLabel><FormControl><Input placeholder="12345678" className="h-11" {...field} /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="md:col-span-4">
                                                <FormField control={form.control} name={`certifications.${index}.expiry_date`} render={({ field }) => (
                                                    <FormItem className="flex flex-col justify-end"><FormLabel>Cert Date / Expiry</FormLabel><FormControl>
                                                        <div className="h-11 flex items-center w-full"><DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" /></div>
                                                    </FormControl></FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" className="w-full gap-2" onClick={() => appendCert({ certification_name: "", certification_no: "", expiry_date: "" })}>
                                        <Plus className="w-4 h-4" /> Add Another Certificate
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* TAB: EMERGENCY */}
                            <TabsContent value="emergency" className="mt-0 outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-primary flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Primary Contact</h3>
                                        <FormField control={form.control} name="emergency_contacts.0.name" render={({ field }) => (
                                            <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input placeholder="Jane Doe" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergency_contacts.0.relationship" render={({ field }) => (
                                            <FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="Spouse" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergency_contacts.0.phone_1" render={({ field }) => (
                                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+1 (555) 000-0000" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergency_contacts.0.email" render={({ field }) => (
                                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="jane@example.com" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><PhoneCall className="w-4 h-4" /> Secondary Contact</h3>
                                        <FormField control={form.control} name="emergency_contacts.1.name" render={({ field }) => (
                                            <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input placeholder="John Smith" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergency_contacts.1.relationship" render={({ field }) => (
                                            <FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="Friend" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergency_contacts.1.phone_1" render={({ field }) => (
                                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+1 (555) 000-0000" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="emergency_contacts.1.email" render={({ field }) => (
                                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john@example.com" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: TRAVEL & ACCOMMODATION */}
                            <TabsContent value="travel" className="mt-0 outline-none">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                        <div className="md:col-span-2"><h3 className="font-semibold text-primary flex items-center gap-2 mb-2"><Home className="w-4 h-4" /> Local Accommodation</h3></div>
                                        <FormField control={form.control} name="accommodation.name" render={({ field }) => (
                                            <FormItem><FormLabel>Hotel / Resort / Guest House</FormLabel><FormControl><Input placeholder="Ocean View Resort" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="accommodation.contact_no" render={({ field }) => (
                                            <FormItem><FormLabel>Room Number / Contact</FormLabel><FormControl><Input placeholder="Room 402" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="accommodation.address" render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Island / Address</FormLabel><FormControl><Input placeholder="Maafushi Island" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                        <div className="md:col-span-2"><h3 className="font-semibold text-primary flex items-center gap-2 mb-2"><Plane className="w-4 h-4" /> Departure Info</h3></div>
                                        <FormField control={form.control} name="departure_date" render={({ field }) => (
                                            <FormItem className="flex flex-col justify-end"><FormLabel>Departure Date</FormLabel><FormControl><div className="h-11 flex items-center w-full"><DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" minDate={new Date().toISOString().split('T')[0]} /></div></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="departure_to" render={({ field }) => (
                                            <FormItem><FormLabel>Destination / Next Stop</FormLabel><FormControl><Input placeholder="e.g. Dubai" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="departure_flight" render={({ field }) => (
                                            <FormItem><FormLabel>Flight Number</FormLabel><FormControl><Input placeholder="e.g., EK653" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="departure_flight_time" render={({ field }) => (
                                            <FormItem><FormLabel>Departure Time</FormLabel><FormControl><Input type="time" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>

                                </div>
                            </TabsContent>

                            {/* TAB: INSURANCE */}
                            <TabsContent value="insurance" className="mt-0 outline-none">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                        <div className="md:col-span-2"><h3 className="font-semibold text-primary flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4" /> Dive Insurance</h3></div>
                                        <FormField control={form.control} name="insurance.insurance_provider" render={({ field }) => (
                                            <FormItem><FormLabel>Provider Name</FormLabel><FormControl><Input placeholder="DAN, Allianz, etc." className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="insurance.insurance_no" render={({ field }) => (
                                            <FormItem><FormLabel>Policy Number</FormLabel><FormControl><Input placeholder="123456789" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="insurance.insurance_hotline_no" render={({ field }) => (
                                            <FormItem><FormLabel>Emergency Hotline</FormLabel><FormControl><Input placeholder="+1 800 000 0000" className="h-11" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="insurance.expiry_date" render={({ field }) => (
                                            <FormItem className="flex flex-col justify-end"><FormLabel>Expiry Date</FormLabel><FormControl><div className="h-11 flex items-center w-full"><DatePicker value={field.value} onChange={field.onChange} placeholder="Pick a date" /></div></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="legal" className="mt-0 outline-none">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm">
                                        <div className="md:col-span-2 text-muted-foreground mb-4">
                                            Check these boxes if the customer has provided physical or pre-signed copies of these documents. Digital waivers can be sent and signed later via the pre-registration link.
                                        </div>
                                        <FormField control={form.control} name="medical_forms.liability_waiver" render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Liability Release / Assumption of Risk</FormLabel>
                                                    <p className="text-sm text-muted-foreground">Customer has signed the standard liability waiver.</p>
                                                </div>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="medical_forms.medical_statement" render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Diver Medical Statement</FormLabel>
                                                    <p className="text-sm text-muted-foreground">Customer has completed the medical questionnaire.</p>
                                                </div>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="medical_forms.medical_certificate" render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Doctor's Medical Clearance</FormLabel>
                                                    <p className="text-sm text-muted-foreground">Received written clearance from a physician (if required).</p>
                                                </div>
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* PDF Generation Section */}
                                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                                        <div className="mb-4">
                                            <h3 className="font-semibold text-primary flex items-center gap-2"><FileText className="w-4 h-4" /> Generate Pre-filled PDFs</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Download PDFs instantly filled with the customer's typed details (Name, DOB, Contact Info).
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {pdfs.map((pdf) => (
                                                <div key={pdf.filename} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 flex flex-col justify-between hover:border-primary/50 transition-colors">
                                                    <div>
                                                        <h4 className="font-semibold text-sm line-clamp-1">{pdf.name}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1 mb-4 line-clamp-2">
                                                            {pdf.description}
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        type="button"
                                                        onClick={() => handleGeneratePdf(pdf.filename)}
                                                        disabled={generatingPdf !== null}
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full gap-2 bg-white dark:bg-black"
                                                    >
                                                        {generatingPdf === pdf.filename ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                        ) : (
                                                            <FileText className="h-4 w-4" />
                                                        )}
                                                        Generate PDF
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                        </CardContent>
                    </Card>
                </Tabs>

                {/* STICKY ACTION BAR */}
                <div className="mt-8 flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm z-20">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    {!initialData && (
                        <Button type="button" variant="secondary" size="lg" disabled={loading} onClick={form.handleSubmit((data) => submitData(data, true))} className="gap-2">
                            <SaveAll className="w-4 h-4" /> Save & Add Another
                        </Button>
                    )}
                    <Button type="button" size="lg" disabled={loading} onClick={form.handleSubmit((data) => submitData(data, false))} className="min-w-[140px]">
                        {loading ? "Saving..." : (initialData ? "Save Changes" : "Create Customer")}
                    </Button>
                </div>

            </form>
        </Form>
    );
}
