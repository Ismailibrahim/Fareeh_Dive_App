"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, CreditCard, Flag, Calendar, AlertCircle, Award, Building, MapPin, Plus, X, CheckCircle2, Plane, Globe } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { safeFormatDate, safeParseDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import { preRegistrationService, PreRegistrationFormData } from "@/lib/api/services/pre-registration.service";
import { nationalityService, Nationality } from "@/lib/api/services/nationality.service";
import { relationshipService, Relationship } from "@/lib/api/services/relationship.service";
import { agencyService, Agency } from "@/lib/api/services/agency.service";
import { countryService, Country } from "@/lib/api/services/country.service";
import axios from "axios";

// Create a separate axios instance for public requests (without auth interceptors)
const publicApiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false, // No auth for public routes
});

const preRegistrationSchema = z.object({
    customer: z.object({
        full_name: z.string().min(2, "Name must be at least 2 characters."),
        email: z.string().email().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        zip_code: z.string().optional(),
        country: z.string().optional(),
        passport_no: z.string().optional(),
        nationality: z.string().optional(),
        gender: z.string().optional(),
        date_of_birth: z.string().optional(),
        departure_date: z.string().optional(),
        departure_flight: z.string().optional(),
        departure_flight_time: z.string().optional(),
        departure_to: z.string().optional(),
    }),
    emergency_contacts: z.array(z.object({
        name: z.string().optional(),
        email: z.string().email().or(z.literal("")).optional(),
        phone_1: z.string().optional(),
        phone_2: z.string().optional(),
        phone_3: z.string().optional(),
        address: z.string().optional(),
        relationship: z.string().optional(),
        is_primary: z.boolean().optional(),
    })).optional(),
    certifications: z.array(z.object({
        certification_name: z.string().min(1, "Certification name is required"),
        certification_no: z.string().optional(),
        certification_date: z.string().min(1, "Certification date is required"),
        last_dive_date: z.string().optional(),
        no_of_dives: z.number().int().min(0).optional(),
        agency: z.string().optional(),
        instructor: z.string().optional(),
        file_url: z.string().optional(),
        license_status: z.boolean().optional(),
    })).optional(),
    insurance: z.object({
        insurance_provider: z.string().optional(),
        insurance_no: z.string().optional(),
        insurance_hotline_no: z.string().optional(),
        file_url: z.string().optional(),
        expiry_date: z.string().optional(),
        status: z.boolean().optional(),
    }).optional(),
    accommodation: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        contact_no: z.string().optional(),
        island: z.string().optional(),
        room_no: z.string().optional(),
    }).optional(),
});

type PreRegistrationFormValues = z.infer<typeof preRegistrationSchema>;

export default function PreRegistrationPage() {
    const params = useParams();
    const token = params.token as string;
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nationalities, setNationalities] = useState<Nationality[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [diveCenterName, setDiveCenterName] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<string>("");
    const [loadingData, setLoadingData] = useState(true);


    const form = useForm<PreRegistrationFormValues>({
        resolver: zodResolver(preRegistrationSchema),
        defaultValues: {
            customer: {
                full_name: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                zip_code: "",
                country: "",
                passport_no: "",
                nationality: "",
                gender: "",
                date_of_birth: "",
                departure_date: "",
                departure_flight: "",
                departure_flight_time: "",
                departure_to: "",
            },
            emergency_contacts: [{
                name: "",
                email: "",
                phone_1: "",
                phone_2: "",
                phone_3: "",
                address: "",
                relationship: "",
                is_primary: false,
            }], // Start with 1 emergency contact
            certifications: [{
                certification_name: "",
                certification_no: "",
                certification_date: "",
                last_dive_date: "",
                no_of_dives: undefined,
                agency: "",
                instructor: "",
                file_url: "",
                license_status: false,
            }], // Start with 1 certification
            insurance: {
                insurance_provider: "",
                insurance_no: "",
                insurance_hotline_no: "",
                file_url: "",
                expiry_date: "",
                status: false,
            },
            accommodation: {
                name: "",
                address: "",
                contact_no: "",
                island: "",
                room_no: "",
            },
        },
    });

    const {
        fields: emergencyContactFields,
        append: appendEmergencyContact,
        remove: removeEmergencyContact,
    } = useFieldArray({
        control: form.control,
        name: "emergency_contacts",
    });

    const {
        fields: certificationFields,
        append: appendCertification,
        remove: removeCertification,
    } = useFieldArray({
        control: form.control,
        name: "certifications",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                
                // Fetch form metadata (public endpoint)
                const formData = await publicApiClient.get(`/api/v1/pre-registration/${token}`);
                setDiveCenterName(formData.data.dive_center.name);
                setExpiresAt(formData.data.expires_at);

                // Fetch nationalities, countries, relationships, agencies (these might need to be public endpoints or we handle errors)
                try {
                    const [nationalitiesData, countriesData, relationshipsData, agenciesData] = await Promise.all([
                        nationalityService.getAll(),
                        countryService.getAll(),
                        relationshipService.getAll(),
                        agencyService.getAll(),
                    ]);
                    setNationalities(nationalitiesData);
                    setCountries(countriesData);
                    setRelationships(relationshipsData);
                    setAgencies(agenciesData);
                } catch (e) {
                    console.error("Failed to fetch dropdown data", e);
                    // Continue anyway - these are optional
                }
            } catch (err: any) {
                if (err.response?.status === 410) {
                    setError(err.response.data.message || "This registration link has expired or has already been used.");
                } else {
                    setError("Failed to load registration form. Please check your link and try again.");
                }
            } finally {
                setLoadingData(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    const onSubmit = async (data: PreRegistrationFormValues) => {
        setSubmitting(true);
        setError(null);

        try {
            // Convert date objects to strings
            const formattedData: PreRegistrationFormData = {
                customer: {
                    ...data.customer,
                },
                emergency_contacts: data.emergency_contacts?.map(contact => ({
                    ...contact,
                    email: contact.email || undefined,
                })) || [],
                certifications: data.certifications?.map(cert => ({
                    ...cert,
                })) || [],
                insurance: Object.keys(data.insurance || {}).length > 0 ? data.insurance : undefined,
                accommodation: Object.keys(data.accommodation || {}).length > 0 ? data.accommodation : undefined,
            };

            await publicApiClient.post(`/api/v1/pre-registration/${token}/submit`, formattedData);
            setSubmitted(true);
        } catch (err: any) {
            if (err.response?.status === 410) {
                setError(err.response.data.message || "This registration link has expired or has already been used.");
            } else if (err.response?.data?.errors) {
                setError("Please check your form for errors and try again.");
            } else {
                setError(err.response?.data?.message || "Failed to submit registration. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading registration form...</p>
                </div>
            </div>
        );
    }

    if (error && !submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Registration Submitted
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Thank you! Your registration has been submitted successfully. Our staff will review your information and confirm your registration shortly.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You will be contacted once your registration is approved.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Pre-Registration Form
                    </h1>
                    <p className="text-muted-foreground">
                        {diveCenterName && `Registering with ${diveCenterName}`}
                    </p>
                    {expiresAt && (
                        <p className="text-sm text-muted-foreground mt-2">
                            This form expires on {safeFormatDate(expiresAt, "PPP", "an unknown date")}
                        </p>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Please provide your basic information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="customer.full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="John Doe" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="customer.gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customer.date_of_birth"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date of Birth</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                        <DatePicker
                                                            selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                                            onChange={(date) => {
                                                                if (date) {
                                                                    const year = date.getFullYear();
                                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                    const day = String(date.getDate()).padStart(2, '0');
                                                                    field.onChange(`${year}-${month}-${day}`);
                                                                } else {
                                                                    field.onChange("");
                                                                }
                                                            }}
                                                            dateFormat="PPP"
                                                            placeholderText="Pick a date"
                                                            wrapperClassName="w-full"
                                                            maxDate={new Date()}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="customer.email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="email@example.com" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customer.phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="+1 (555) 000-0000" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="customer.passport_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Passport Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="A12345678" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customer.nationality"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nationality</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Flag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                            <SelectTrigger className="pl-9">
                                                                <SelectValue placeholder="Select nationality" />
                                                            </SelectTrigger>
                                                        </div>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {nationalities.map((nationality) => (
                                                            <SelectItem key={nationality.id} value={nationality.name}>
                                                                {nationality.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {/* Address Information */}
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Address Information
                                    </h3>
                                    <FormField
                                        control={form.control}
                                        name="customer.address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="123 Main Street" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="customer.city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="New York" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="customer.zip_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Zip Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="10001" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="customer.country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                            <SelectTrigger className="pl-9">
                                                                <SelectValue placeholder="Select country" />
                                                            </SelectTrigger>
                                                        </div>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.id} value={country.name}>
                                                                {country.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {/* Departure Information */}
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Plane className="h-5 w-5 text-primary" />
                                        Departure Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="customer.departure_date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Departure Date</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                            <DatePicker
                                                                selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                                                onChange={(date) => {
                                                                    if (date) {
                                                                        const year = date.getFullYear();
                                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                        const day = String(date.getDate()).padStart(2, '0');
                                                                        field.onChange(`${year}-${month}-${day}`);
                                                                    } else {
                                                                        field.onChange("");
                                                                    }
                                                                }}
                                                                dateFormat="PPP"
                                                                placeholderText="Pick a date"
                                                                wrapperClassName="w-full"
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
                                        <FormField
                                            control={form.control}
                                            name="customer.departure_flight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Departure Flight</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Plane className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="e.g. EK123" className="pl-9" {...field} value={field.value ?? ""} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="customer.departure_flight_time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Flight Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} value={field.value ?? ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="customer.departure_to"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Departure To</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="e.g. Dubai, UAE" className="pl-9" {...field} value={field.value ?? ""} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Emergency Contacts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-primary" />
                                    Emergency Contacts
                                </CardTitle>
                                <CardDescription>
                                    Add at least one emergency contact.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {emergencyContactFields.map((field, index) => (
                                    <Card key={field.id} className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-medium">Emergency Contact {index + 1}</h4>
                                            {emergencyContactFields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeEmergencyContact(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`emergency_contacts.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value ?? ""} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`emergency_contacts.${index}.email`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email</FormLabel>
                                                            <FormControl>
                                                                <Input type="email" {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`emergency_contacts.${index}.relationship`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Relationship</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select relationship" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {relationships.map((rel) => (
                                                                        <SelectItem key={rel.id} value={rel.name}>
                                                                            {rel.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`emergency_contacts.${index}.phone_1`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone 1</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`emergency_contacts.${index}.phone_2`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone 2</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`emergency_contacts.${index}.phone_3`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone 3</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name={`emergency_contacts.${index}.address`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value ?? ""} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Certifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    Diving Certifications
                                </CardTitle>
                                <CardDescription>
                                    Add your diving certifications.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {certificationFields.map((field, index) => (
                                    <Card key={field.id} className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-medium">Certification {index + 1}</h4>
                                            {certificationFields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeCertification(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`certifications.${index}.certification_name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Certification Name *</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`certifications.${index}.certification_no`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Certification Number</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`certifications.${index}.certification_date`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Certification Date *</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                                    <DatePicker
                                                                        selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                                                        onChange={(date) => {
                                                                            if (date) {
                                                                                const year = date.getFullYear();
                                                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                                const day = String(date.getDate()).padStart(2, '0');
                                                                                field.onChange(`${year}-${month}-${day}`);
                                                                            } else {
                                                                                field.onChange("");
                                                                            }
                                                                        }}
                                                                        dateFormat="PPP"
                                                                        placeholderText="Pick a date"
                                                                        wrapperClassName="w-full"
                                                                        maxDate={new Date()}
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
                                                <FormField
                                                    control={form.control}
                                                    name={`certifications.${index}.last_dive_date`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Last Dive Date</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                                    <DatePicker
                                                                        selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                                                        onChange={(date) => {
                                                                            if (date) {
                                                                                const year = date.getFullYear();
                                                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                                const day = String(date.getDate()).padStart(2, '0');
                                                                                field.onChange(`${year}-${month}-${day}`);
                                                                            } else {
                                                                                field.onChange("");
                                                                            }
                                                                        }}
                                                                        dateFormat="PPP"
                                                                        placeholderText="Pick a date"
                                                                        wrapperClassName="w-full"
                                                                        maxDate={new Date()}
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
                                                <FormField
                                                    control={form.control}
                                                    name={`certifications.${index}.no_of_dives`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Number of Dives</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="e.g. 50"
                                                                    min="0"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                                                        field.onChange(value);
                                                                    }}
                                                                    value={field.value ?? ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`certifications.${index}.agency`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Agency</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select agency" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {agencies.map((agency) => (
                                                                        <SelectItem key={agency.id} value={agency.name}>
                                                                            {agency.name}
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
                                                    name={`certifications.${index}.instructor`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Instructor</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Insurance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    Insurance Information
                                </CardTitle>
                                <CardDescription>
                                    Provide your insurance details (optional).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="insurance.insurance_provider"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Insurance Provider</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="insurance.insurance_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Insurance Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="insurance.insurance_hotline_no"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Insurance Hotline Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="insurance.expiry_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Expiry Date</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                    <DatePicker
                                                        selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                                        onChange={(date) => {
                                                            if (date) {
                                                                const year = date.getFullYear();
                                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                const day = String(date.getDate()).padStart(2, '0');
                                                                field.onChange(`${year}-${month}-${day}`);
                                                            } else {
                                                                field.onChange("");
                                                            }
                                                        }}
                                                        dateFormat="PPP"
                                                        placeholderText="Pick a date"
                                                        wrapperClassName="w-full"
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
                            </CardContent>
                        </Card>

                        {/* Accommodation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Accommodation Information
                                </CardTitle>
                                <CardDescription>
                                    Where will you be staying? (optional)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="accommodation.name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Accommodation Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accommodation.address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="accommodation.contact_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="accommodation.island"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Island</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="accommodation.room_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Room Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-4">
                            <Button type="submit" size="lg" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Registration"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

