"use client";

import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instructorService, InstructorFormData, Instructor } from "@/lib/api/services/instructor.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Award, Mail, Phone, CalendarIcon, FileText, Briefcase, MapPin, Shield, Clock, Upload, X, CheckCircle2 } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { format } from "date-fns";
import { safeParseDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import { fileUploadService } from "@/lib/api/services/file-upload.service";

const instructorSchema = z.object({
    // User fields (if creating new user)
    user_id: z.number().optional(),
    full_name: z.string().min(2, "Name must be at least 2 characters.").optional(),
    email: z.string().email().or(z.literal("")).optional(),
    password: z.string().min(8, "Password must be at least 8 characters.").optional(),
    phone: z.string().optional(),
    // Core Certification
    instructor_number: z.string().optional(),
    certification_agency: z.string().optional(),
    certification_level: z.string().optional(),
    certification_date: z.date().optional().nullable(),
    certification_expiry: z.date().optional().nullable(),
    instructor_status: z.enum(['Active', 'Suspended', 'Expired']).optional(),
    // Contact & Emergency
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
    address: z.string().optional(),
    nationality: z.string().optional(),
    passport_number: z.string().optional(),
    // Availability
    availability_status: z.enum(['Available', 'Unavailable', 'On Leave']).optional(),
    max_dives_per_day: z.number().optional(),
    // Professional
    years_of_experience: z.number().optional(),
    total_dives_logged: z.number().optional(),
    total_students_certified: z.number().optional(),
    bio: z.string().optional(),
    // Medical & Insurance
    medical_certificate_expiry: z.date().optional().nullable(),
    insurance_provider: z.string().optional(),
    insurance_provider_contact_no: z.string().optional(),
    insurance_type: z.string().optional(),
    insurance_policy_number: z.string().optional(),
    insurance_expiry: z.date().optional().nullable(),
    // Metadata
    notes: z.string().optional(),
    hired_date: z.date().optional().nullable(),
    // Documents
    certificate_file_url: z.string().optional(),
    insurance_file_url: z.string().optional(),
    contract_file_url: z.string().optional(),
});

interface InstructorFormProps {
    initialData?: Instructor;
    instructorId?: string | number;
}

export function InstructorForm({ initialData, instructorId }: InstructorFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ name: string; url: string; type: string }>>([]);

    const form = useForm<z.infer<typeof instructorSchema>>({
        resolver: zodResolver(instructorSchema),
        defaultValues: {
            user_id: initialData?.user_id,
            full_name: initialData?.user?.full_name || "",
            email: initialData?.user?.email || "",
            phone: initialData?.user?.phone || "",
            instructor_number: initialData?.instructor_number || "",
            certification_agency: initialData?.certification_agency || "",
            certification_level: initialData?.certification_level || "",
            certification_date: initialData?.certification_date ? (safeParseDate(initialData.certification_date) ?? null) : null,
            certification_expiry: initialData?.certification_expiry ? (safeParseDate(initialData.certification_expiry) ?? null) : null,
            instructor_status: initialData?.instructor_status || "Active",
            emergency_contact_name: initialData?.emergency_contact_name || "",
            emergency_contact_phone: initialData?.emergency_contact_phone || "",
            emergency_contact_relationship: initialData?.emergency_contact_relationship || "",
            address: initialData?.address || "",
            nationality: initialData?.nationality || "",
            passport_number: initialData?.passport_number || "",
            availability_status: initialData?.availability_status || "Available",
            max_dives_per_day: initialData?.max_dives_per_day,
            hourly_rate: initialData?.hourly_rate,
            commission_percentage: initialData?.commission_percentage,
            payment_method: initialData?.payment_method || "",
            years_of_experience: initialData?.years_of_experience,
            total_dives_logged: initialData?.total_dives_logged,
            total_students_certified: initialData?.total_students_certified,
            bio: initialData?.bio || "",
            medical_certificate_expiry: initialData?.medical_certificate_expiry ? (safeParseDate(initialData.medical_certificate_expiry) ?? null) : null,
            insurance_provider: initialData?.insurance_provider || "",
            insurance_provider_contact_no: initialData?.insurance_provider_contact_no || "",
            insurance_type: initialData?.insurance_type || "",
            insurance_policy_number: initialData?.insurance_policy_number || "",
            insurance_expiry: initialData?.insurance_expiry ? (safeParseDate(initialData.insurance_expiry) ?? null) : null,
            notes: initialData?.notes || "",
            hired_date: initialData?.hired_date ? (safeParseDate(initialData.hired_date) ?? null) : null,
            certificate_file_url: initialData?.certificate_file_url || "",
            insurance_file_url: initialData?.insurance_file_url || "",
            contract_file_url: initialData?.contract_file_url || "",
        },
    });

    // Initialize uploaded documents from initialData
    useEffect(() => {
        const docs: Array<{ name: string; url: string; type: string }> = [];
        if (initialData?.certificate_file_url) {
            docs.push({ name: "Certificate", url: initialData.certificate_file_url, type: "certificate" });
        }
        if (initialData?.insurance_file_url) {
            docs.push({ name: "Insurance", url: initialData.insurance_file_url, type: "insurance" });
        }
        if (initialData?.contract_file_url) {
            docs.push({ name: "Contract", url: initialData.contract_file_url, type: "contract" });
        }
        setUploadedDocuments(docs);
    }, [initialData]);

    const handleFileUpload = async (file: File, documentType: string) => {
        setUploading(true);
        try {
            const result = await fileUploadService.upload(file, 'instructors');
            if (result.success) {
                const newDoc = { name: result.original_name, url: result.url, type: documentType };
                // Replace existing document of the same type, or add new one
                setUploadedDocuments(prev => {
                    const filtered = prev.filter(doc => doc.type !== documentType);
                    return [...filtered, newDoc];
                });
                
                // Update form value based on document type
                if (documentType === 'certificate') {
                    form.setValue('certificate_file_url', result.url);
                } else if (documentType === 'insurance') {
                    form.setValue('insurance_file_url', result.url);
                } else if (documentType === 'contract') {
                    form.setValue('contract_file_url', result.url);
                }
            } else {
                alert(result.message || 'Failed to upload file');
            }
        } catch (error: any) {
            console.error('File upload error:', error);
            alert(error?.response?.data?.message || 'Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
                return;
            }
            handleFileUpload(file, documentType);
        }
    };

    const removeDocument = (index: number, docType: string) => {
        setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
        // Clear form value
        if (docType === 'certificate') {
            form.setValue('certificate_file_url', '');
        } else if (docType === 'insurance') {
            form.setValue('insurance_file_url', '');
        } else if (docType === 'contract') {
            form.setValue('contract_file_url', '');
        }
    };

    async function onSubmit(data: z.infer<typeof instructorSchema>) {
        setLoading(true);
        try {
            // Convert Date objects to strings and empty strings to undefined
            const cleanData: InstructorFormData = {
                user_id: data.user_id,
                full_name: data.full_name && data.full_name.trim() !== "" ? data.full_name : undefined,
                email: data.email && data.email.trim() !== "" ? data.email : undefined,
                password: data.password && data.password.trim() !== "" ? data.password : undefined,
                phone: data.phone && data.phone.trim() !== "" ? data.phone : undefined,
                instructor_number: data.instructor_number && data.instructor_number.trim() !== "" ? data.instructor_number : undefined,
                certification_agency: data.certification_agency && data.certification_agency.trim() !== "" ? data.certification_agency : undefined,
                certification_level: data.certification_level && data.certification_level.trim() !== "" ? data.certification_level : undefined,
                certification_date: data.certification_date ? format(data.certification_date, "yyyy-MM-dd") : undefined,
                certification_expiry: data.certification_expiry ? format(data.certification_expiry, "yyyy-MM-dd") : undefined,
                instructor_status: data.instructor_status,
                emergency_contact_name: data.emergency_contact_name && data.emergency_contact_name.trim() !== "" ? data.emergency_contact_name : undefined,
                emergency_contact_phone: data.emergency_contact_phone && data.emergency_contact_phone.trim() !== "" ? data.emergency_contact_phone : undefined,
                emergency_contact_relationship: data.emergency_contact_relationship && data.emergency_contact_relationship.trim() !== "" ? data.emergency_contact_relationship : undefined,
                address: data.address && data.address.trim() !== "" ? data.address : undefined,
                nationality: data.nationality && data.nationality.trim() !== "" ? data.nationality : undefined,
                passport_number: data.passport_number && data.passport_number.trim() !== "" ? data.passport_number : undefined,
                availability_status: data.availability_status,
                max_dives_per_day: data.max_dives_per_day,
                years_of_experience: data.years_of_experience,
                total_dives_logged: data.total_dives_logged,
                total_students_certified: data.total_students_certified,
                bio: data.bio && data.bio.trim() !== "" ? data.bio : undefined,
                medical_certificate_expiry: data.medical_certificate_expiry ? format(data.medical_certificate_expiry, "yyyy-MM-dd") : undefined,
                insurance_provider: data.insurance_provider && data.insurance_provider.trim() !== "" ? data.insurance_provider : undefined,
                insurance_provider_contact_no: data.insurance_provider_contact_no && data.insurance_provider_contact_no.trim() !== "" ? data.insurance_provider_contact_no : undefined,
                insurance_type: data.insurance_type && data.insurance_type.trim() !== "" ? data.insurance_type : undefined,
                insurance_policy_number: data.insurance_policy_number && data.insurance_policy_number.trim() !== "" ? data.insurance_policy_number : undefined,
                insurance_expiry: data.insurance_expiry ? format(data.insurance_expiry, "yyyy-MM-dd") : undefined,
                notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
                hired_date: data.hired_date ? format(data.hired_date, "yyyy-MM-dd") : undefined,
                // Document URLs
                certificate_file_url: data.certificate_file_url && data.certificate_file_url.trim() !== "" ? data.certificate_file_url.trim() : undefined,
                insurance_file_url: data.insurance_file_url && data.insurance_file_url.trim() !== "" ? data.insurance_file_url.trim() : undefined,
                contract_file_url: data.contract_file_url && data.contract_file_url.trim() !== "" ? data.contract_file_url.trim() : undefined,
            };

            if (instructorId) {
                await instructorService.update(instructorId, cleanData);
                router.push("/dashboard/instructors");
                router.refresh();
            } else {
                await instructorService.create(cleanData);
                router.push("/dashboard/instructors");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save instructor", error);
        } finally {
            setLoading(false);
        }
    }

    const isEditMode = !!instructorId;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* User Information - Only show if creating new */}
                {!isEditMode && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                User Information
                            </CardTitle>
                            <CardDescription>
                                Basic user account details for the instructor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
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
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="john@example.com" type="email" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="+1234567890" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Core Certification */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Certification Information
                        </CardTitle>
                        <CardDescription>
                            Instructor certification details and credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="instructor_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instructor Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="PADI #12345" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="certification_agency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Certification Agency</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select agency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PADI">PADI</SelectItem>
                                                <SelectItem value="SSI">SSI</SelectItem>
                                                <SelectItem value="NAUI">NAUI</SelectItem>
                                                <SelectItem value="CMAS">CMAS</SelectItem>
                                                <SelectItem value="BSAC">BSAC</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="certification_level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Certification Level</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Open Water Scuba Instructor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="certification_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Certification Date</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(date)}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date"
                                                    wrapperClassName="w-full"
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
                            <FormField
                                control={form.control}
                                name="certification_expiry"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Certification Expiry</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(date)}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date"
                                                    wrapperClassName="w-full"
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
                            <FormField
                                control={form.control}
                                name="instructor_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "Active"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Suspended">Suspended</SelectItem>
                                                <SelectItem value="Expired">Expired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Emergency */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Contact & Emergency Information
                        </CardTitle>
                        <CardDescription>
                            Contact details and emergency contact information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Full address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="nationality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nationality</FormLabel>
                                        <FormControl>
                                            <Input placeholder="American" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="passport_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Passport Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="A12345678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="emergency_contact_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emergency Contact Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jane Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="emergency_contact_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emergency Contact Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="emergency_contact_relationship"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Relationship</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Spouse" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Availability */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Availability & Schedule
                        </CardTitle>
                        <CardDescription>
                            Availability status and scheduling preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="availability_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Availability Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "Available"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Available">Available</SelectItem>
                                                <SelectItem value="Unavailable">Unavailable</SelectItem>
                                                <SelectItem value="On Leave">On Leave</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="max_dives_per_day"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Dives Per Day</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="4" 
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Professional History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Professional History
                        </CardTitle>
                        <CardDescription>
                            Experience and professional background.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="years_of_experience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Years of Experience</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="5" 
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="total_dives_logged"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Dives Logged</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="500" 
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="total_students_certified"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Students Certified</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="100" 
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Biography</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Brief biography about the instructor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="hired_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Hired Date</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                            <DatePicker
                                                selected={field.value}
                                                onChange={(date) => field.onChange(date)}
                                                dateFormat="PPP"
                                                placeholderText="Pick a date"
                                                wrapperClassName="w-full"
                                                maxDate={new Date()}
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
                    </CardContent>
                </Card>

                {/* Medical & Insurance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Medical & Insurance
                        </CardTitle>
                        <CardDescription>
                            Medical certificate and insurance information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="medical_certificate_expiry"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Medical Certificate Expiry</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                            <DatePicker
                                                selected={field.value}
                                                onChange={(date) => field.onChange(date)}
                                                dateFormat="PPP"
                                                placeholderText="Pick a date"
                                                wrapperClassName="w-full"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="insurance_provider"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Provider</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Insurance Company" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insurance_provider_contact_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Provider Contact No</FormLabel>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="insurance_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Type</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Professional Liability" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insurance_policy_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Policy Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="POL-12345" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insurance_expiry"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Insurance Expiry</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(date)}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date"
                                                    wrapperClassName="w-full"
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
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Documents
                        </CardTitle>
                        <CardDescription>
                            Upload instructor documents (certificates, insurance, contracts, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {/* Uploaded Documents */}
                        {uploadedDocuments.length > 0 && (
                            <div className="space-y-3">
                                {uploadedDocuments.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                                                <a 
                                                    href={doc.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    View file
                                                </a>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeDocument(index, doc.type)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Document Upload Buttons */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Certificate</label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'certificate')}
                                            disabled={uploading}
                                        />
                                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {uploading ? 'Uploading...' : 'Upload Certificate'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Insurance</label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'insurance')}
                                            disabled={uploading}
                                        />
                                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {uploading ? 'Uploading...' : 'Upload Insurance'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Contract</label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'contract')}
                                            disabled={uploading}
                                        />
                                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {uploading ? 'Uploading...' : 'Upload Contract'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Additional Notes
                        </CardTitle>
                        <CardDescription>
                            Internal notes and additional information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Internal notes about the instructor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (instructorId ? "Update Instructor" : "Create Instructor")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

