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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomerCertificationFormData } from "@/lib/api/services/customer-certification.service";
import { useCreateCustomerCertification, useUpdateCustomerCertification } from "@/lib/hooks/use-customer-certifications";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { agencyService, Agency } from "@/lib/api/services/agency.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Award, User, Building, UserCircle, FileText, Upload, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { safeParseDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { fileUploadService } from "@/lib/api/services/file-upload.service";
import { Switch } from "@/components/ui/switch";

const certificationSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    certification_name: z.string().min(2, "Certification name is required"),
    certification_no: z.string().optional(),
    certification_date: z.date(),
    last_dive_date: z.date().optional(),
    no_of_dives: z.number().int().min(0).optional(),
    agency: z.string().optional(),
    instructor: z.string().optional(),
    file_url: z.string().optional(),
    license_status: z.boolean(),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

interface CustomerCertificationFormProps {
    initialData?: any;
    certificationId?: number;
    disableCustomerSelect?: boolean;
    redirectToCustomer?: boolean;
}

export function CustomerCertificationForm({ initialData, certificationId, disableCustomerSelect = false, redirectToCustomer = false }: CustomerCertificationFormProps) {
    const router = useRouter();
    const createMutation = useCreateCustomerCertification();
    const updateMutation = useUpdateCustomerCertification();
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [agencies, setAgencies] = useState<Agency[]>([]);
    
    const loading = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await customerService.getAll();
                const list = Array.isArray(data) ? data : (data as any).data || [];
                setCustomers(list);
            } catch (error) {
                console.error("Failed to load customers", error);
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const data = await agencyService.getAll();
                setAgencies(data);
            } catch (error) {
                console.error("Failed to load agencies", error);
            }
        };
        fetchAgencies();
    }, []);

    const form = useForm<CertificationFormValues>({
        resolver: zodResolver(certificationSchema),
        defaultValues: {
            customer_id: initialData?.customer_id ? String(initialData.customer_id) : "",
            certification_name: initialData?.certification_name || "",
            certification_no: initialData?.certification_no || "",
            certification_date: initialData?.certification_date ? safeParseDate(initialData.certification_date) ?? undefined : undefined,
            last_dive_date: initialData?.last_dive_date ? safeParseDate(initialData.last_dive_date) ?? undefined : undefined,
            no_of_dives: initialData?.no_of_dives ?? undefined,
            agency: initialData?.agency || "",
            instructor: initialData?.instructor || "",
            file_url: initialData?.file_url || "",
            license_status: initialData?.license_status !== undefined ? initialData.license_status : true,
        },
    });

    // Update form when initialData changes (e.g., when customer_id is passed via query param)
    useEffect(() => {
        if (initialData?.customer_id && !certificationId) {
            form.setValue('customer_id', String(initialData.customer_id));
        }
        if (initialData?.file_url) {
            setUploadedFile({ name: 'Current file', url: initialData.file_url });
        }
    }, [initialData, certificationId, form]);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const result = await fileUploadService.upload(file);
            if (result.success) {
                form.setValue('file_url', result.url);
                setUploadedFile({ name: result.original_name, url: result.url });
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            handleFileUpload(file);
        }
    };

    const removeFile = () => {
        form.setValue('file_url', '');
        setUploadedFile(null);
    };

    async function onSubmit(data: CertificationFormValues) {
        try {
            const payload: CustomerCertificationFormData = {
                customer_id: parseInt(data.customer_id),
                certification_name: data.certification_name,
                certification_no: data.certification_no && data.certification_no.trim() !== '' ? data.certification_no.trim() : undefined,
                certification_date: format(data.certification_date, "yyyy-MM-dd"),
                last_dive_date: data.last_dive_date ? format(data.last_dive_date, "yyyy-MM-dd") : undefined,
                no_of_dives: data.no_of_dives !== undefined ? data.no_of_dives : undefined,
                agency: data.agency && data.agency.trim() !== '' ? data.agency.trim() : undefined,
                instructor: data.instructor && data.instructor.trim() !== '' ? data.instructor.trim() : undefined,
                file_url: data.file_url && data.file_url.trim() !== '' ? data.file_url.trim() : undefined,
                license_status: data.license_status,
            };

            console.log('Submitting certification:', payload);

            let customerId: number | null = null;
            if (certificationId) {
                const result = await updateMutation.mutateAsync({ id: certificationId, data: payload });
                customerId = result.customer_id;
            } else {
                const newCert = await createMutation.mutateAsync(payload);
                customerId = newCert.customer_id;
            }
            
            // Redirect based on context
            if (redirectToCustomer && customerId) {
                router.push(`/dashboard/customers/${customerId}`);
            } else {
                router.push("/dashboard/customer-certifications");
            }
            router.refresh();
        } catch (error: any) {
            console.error("Failed to save certification", error);
            console.error("Error response:", error?.response?.data);
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to save certification. Please try again.";
            alert(errorMessage);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Customer & Certification Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Certification Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about the certification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {!disableCustomerSelect && (
                            <FormField
                                control={form.control}
                                name="customer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select a customer" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="certification_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Certification Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g. Open Water Diver" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="agency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agency</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select an agency" />
                                                </SelectTrigger>
                                            </div>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="certification_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Certification Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g. PADI-123456" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="certification_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date Certified</FormLabel>
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="last_dive_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Last Dive Date (Optional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(date)}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date (optional)"
                                                    wrapperClassName="w-full"
                                                    maxDate={new Date()}
                                                    minDate={new Date("1900-01-01")}
                                                    isClearable
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
                                name="no_of_dives"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Dives (Optional)</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="license_status"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">License Status</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            {field.value ? "Active" : "Inactive"}
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Document Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Document Information
                        </CardTitle>
                        <CardDescription>
                            Upload certificate file or provide a URL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {uploadedFile ? (
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                                        <a 
                                            href={uploadedFile.url} 
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
                                    onClick={removeFile}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Upload Certificate File
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 cursor-pointer">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                disabled={uploading}
                                            />
                                            <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                                                <Upload className="h-5 w-5 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    {uploading ? 'Uploading...' : 'Choose file to upload'}
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="file_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Certificate File URL</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="https://..." className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (certificationId ? "Update Certification" : "Create Certification")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
