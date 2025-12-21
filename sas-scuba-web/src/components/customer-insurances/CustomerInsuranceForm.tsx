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
import { CustomerInsuranceFormData } from "@/lib/api/services/customer-insurance.service";
import { useCreateCustomerInsurance, useUpdateCustomerInsurance } from "@/lib/hooks/use-customer-insurances";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Shield, User, Phone, FileText, Upload, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import { fileUploadService } from "@/lib/api/services/file-upload.service";
import { Switch } from "@/components/ui/switch";

const insuranceSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    insurance_provider: z.string().optional(),
    insurance_no: z.string().optional(),
    insurance_hotline_no: z.string().optional(),
    expiry_date: z.date().optional(),
    file_url: z.string().optional(),
    status: z.boolean().default(true),
});

type InsuranceFormValues = z.infer<typeof insuranceSchema>;

interface CustomerInsuranceFormProps {
    initialData?: any;
    insuranceId?: number;
    disableCustomerSelect?: boolean;
    redirectToCustomer?: boolean;
}

export function CustomerInsuranceForm({ initialData, insuranceId, disableCustomerSelect = false, redirectToCustomer = false }: CustomerInsuranceFormProps) {
    const router = useRouter();
    const createMutation = useCreateCustomerInsurance();
    const updateMutation = useUpdateCustomerInsurance();
    const [uploading, setUploading] = useState(false);
    
    const loading = createMutation.isPending || updateMutation.isPending;
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);

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

    const form = useForm<InsuranceFormValues>({
        resolver: zodResolver(insuranceSchema),
        defaultValues: {
            customer_id: initialData?.customer_id ? String(initialData.customer_id) : "",
            insurance_provider: initialData?.insurance_provider || "",
            insurance_no: initialData?.insurance_no || "",
            insurance_hotline_no: initialData?.insurance_hotline_no || "",
            expiry_date: initialData?.expiry_date ? new Date(initialData.expiry_date) : undefined,
            file_url: initialData?.file_url || "",
            status: initialData?.status !== undefined ? initialData.status : true,
        },
    });

    // Update form when initialData changes (e.g., when customer_id is passed via query param)
    useEffect(() => {
        if (initialData?.customer_id && !insuranceId) {
            form.setValue('customer_id', String(initialData.customer_id));
        }
        if (initialData?.file_url) {
            setUploadedFile({ name: 'Current file', url: initialData.file_url });
        }
    }, [initialData, insuranceId, form]);

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

    async function onSubmit(data: InsuranceFormValues) {
        try {
            const payload: CustomerInsuranceFormData = {
                customer_id: parseInt(data.customer_id),
                insurance_provider: data.insurance_provider && data.insurance_provider.trim() !== '' ? data.insurance_provider.trim() : undefined,
                insurance_no: data.insurance_no && data.insurance_no.trim() !== '' ? data.insurance_no.trim() : undefined,
                insurance_hotline_no: data.insurance_hotline_no && data.insurance_hotline_no.trim() !== '' ? data.insurance_hotline_no.trim() : undefined,
                expiry_date: data.expiry_date ? format(data.expiry_date, "yyyy-MM-dd") : undefined,
                file_url: data.file_url && data.file_url.trim() !== '' ? data.file_url.trim() : undefined,
                status: data.status,
            };

            console.log('Submitting insurance:', payload);

            let customerId: number | null = null;
            if (insuranceId) {
                const result = await updateMutation.mutateAsync({ id: insuranceId, data: payload });
                customerId = result.customer_id;
            } else {
                const newInsurance = await createMutation.mutateAsync(payload);
                customerId = newInsurance.customer_id;
            }
            
            // Redirect based on context
            if (redirectToCustomer && customerId) {
                router.push(`/dashboard/customers/${customerId}`);
            } else {
                router.push("/dashboard/customer-insurances");
            }
            router.refresh();
        } catch (error: any) {
            console.error("Failed to save insurance", error);
            console.error("Error response:", error?.response?.data);
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to save insurance. Please try again.";
            alert(errorMessage);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Customer & Insurance Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Insurance Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about the insurance.
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
                            name="insurance_provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Insurance Provider</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g. Blue Cross Insurance" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="insurance_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g. INS-123456" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="insurance_hotline_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Hotline Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g. +1-800-123-4567" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="expiry_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Expiry Date (Optional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                            <DatePicker
                                                selected={field.value}
                                                onChange={(date) => field.onChange(date)}
                                                dateFormat="PPP"
                                                placeholderText="Pick a date (optional)"
                                                wrapperClassName="w-full"
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
                            name="status"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Status</FormLabel>
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
                            Upload insurance document file or provide a URL.
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
                                        Upload Insurance Document File
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
                                            <FormLabel>Insurance Document File URL</FormLabel>
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
                        {loading ? "Saving..." : (insuranceId ? "Update Insurance" : "Create Insurance")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

