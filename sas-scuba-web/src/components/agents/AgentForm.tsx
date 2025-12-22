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
import { agentService, AgentFormData, Agent } from "@/lib/api/services/agent.service";
import { tagService, Tag } from "@/lib/api/services/tag.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Mail, Phone, DollarSign, CreditCard, FileText, Tag as TagIcon, Upload, X, CheckCircle2 } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { safeParseDate } from "@/lib/utils/date-format";
import { fileUploadService } from "@/lib/api/services/file-upload.service";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const agentSchema = z.object({
    agent_name: z.string().min(2, "Agent name must be at least 2 characters."),
    agent_type: z.enum(['Travel Agent', 'Resort / Guest House', 'Tour Operator', 'Freelancer']),
    country: z.string().min(1, "Country is required."),
    city: z.string().min(1, "City is required."),
    status: z.enum(['Active', 'Suspended']).optional(),
    brand_name: z.string().optional(),
    website: z.string().url().or(z.literal("")).optional(),
    notes: z.string().optional(),
    
    // Contact
    contact: z.object({
        contact_person_name: z.string().min(1, "Contact person name is required."),
        job_title: z.string().optional(),
        email: z.string().email("Invalid email address."),
        phone: z.string().optional(),
        secondary_contact: z.string().optional(),
        preferred_communication_method: z.enum(['Email', 'Phone', 'WhatsApp', 'Other']).optional(),
    }).optional(),
    
    // Commercial Terms
    commercial_terms: z.object({
        commission_type: z.enum(['Percentage', 'Fixed Amount']),
        commission_rate: z.number().min(0, "Commission rate must be positive."),
        currency: z.string().min(1, "Currency is required."),
        vat_applicable: z.boolean().optional(),
        tax_registration_no: z.string().optional(),
        payment_terms: z.enum(['Prepaid', 'Weekly', 'Monthly', 'On Invoice']),
        credit_limit: z.number().min(0).optional(),
    }).optional(),
    
    // Billing Info
    billing_info: z.object({
        company_legal_name: z.string().optional(),
        billing_address: z.string().optional(),
        invoice_email: z.string().email().or(z.literal("")).optional(),
        bank_name: z.string().optional(),
        account_name: z.string().optional(),
        account_number: z.string().optional(),
        swift_iban: z.string().optional(),
        payment_method: z.enum(['Bank Transfer', 'Cash', 'Online']).optional(),
    }).optional(),
    
    // Contract
    contract: z.object({
        contract_start_date: z.date().optional().nullable(),
        contract_end_date: z.date().optional().nullable(),
        commission_valid_from: z.date().optional().nullable(),
        commission_valid_until: z.date().optional().nullable(),
        signed_agreement_url: z.string().optional(),
        special_conditions: z.string().optional(),
    }).optional(),
    
    // Tags
    tag_ids: z.array(z.number()).optional(),
});

interface AgentFormProps {
    initialData?: Agent;
    agentId?: string | number;
}

export function AgentForm({ initialData, agentId }: AgentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [uploadedContract, setUploadedContract] = useState<{ name: string; url: string } | null>(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await tagService.getAll();
                setTags(data);
            } catch (error) {
                console.error("Failed to fetch tags", error);
            }
        };
        fetchTags();
    }, []);

    useEffect(() => {
        if (initialData?.contract?.signed_agreement_url) {
            setUploadedContract({
                name: "Contract Agreement",
                url: initialData.contract.signed_agreement_url,
            });
        }
    }, [initialData]);

    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            agent_name: initialData?.agent_name || "",
            agent_type: initialData?.agent_type || "Travel Agent",
            country: initialData?.country || "",
            city: initialData?.city || "",
            status: initialData?.status || "Active",
            brand_name: initialData?.brand_name || "",
            website: initialData?.website || "",
            notes: initialData?.notes || "",
            contact: initialData?.contacts?.[0] ? {
                contact_person_name: initialData.contacts[0].contact_person_name || "",
                job_title: initialData.contacts[0].job_title || "",
                email: initialData.contacts[0].email || "",
                phone: initialData.contacts[0].phone || "",
                secondary_contact: initialData.contacts[0].secondary_contact || "",
                preferred_communication_method: initialData.contacts[0].preferred_communication_method || "Email",
            } : undefined,
            commercial_terms: initialData?.commercial_terms ? {
                commission_type: initialData.commercial_terms.commission_type,
                commission_rate: initialData.commercial_terms.commission_rate,
                currency: initialData.commercial_terms.currency || "",
                vat_applicable: initialData.commercial_terms.vat_applicable || false,
                tax_registration_no: initialData.commercial_terms.tax_registration_no || "",
                payment_terms: initialData.commercial_terms.payment_terms,
                credit_limit: initialData.commercial_terms.credit_limit,
            } : undefined,
            billing_info: initialData?.billing_info ? {
                company_legal_name: initialData.billing_info.company_legal_name || "",
                billing_address: initialData.billing_info.billing_address || "",
                invoice_email: initialData.billing_info.invoice_email || "",
                bank_name: initialData.billing_info.bank_name || "",
                account_name: initialData.billing_info.account_name || "",
                account_number: initialData.billing_info.account_number || "",
                swift_iban: initialData.billing_info.swift_iban || "",
                payment_method: initialData.billing_info.payment_method,
            } : undefined,
            contract: initialData?.contract ? {
                contract_start_date: initialData.contract.contract_start_date ? (safeParseDate(initialData.contract.contract_start_date) ?? null) : null,
                contract_end_date: initialData.contract.contract_end_date ? (safeParseDate(initialData.contract.contract_end_date) ?? null) : null,
                commission_valid_from: initialData.contract.commission_valid_from ? (safeParseDate(initialData.contract.commission_valid_from) ?? null) : null,
                commission_valid_until: initialData.contract.commission_valid_until ? (safeParseDate(initialData.contract.commission_valid_until) ?? null) : null,
                signed_agreement_url: initialData.contract.signed_agreement_url || "",
                special_conditions: initialData.contract.special_conditions || "",
            } : undefined,
            tag_ids: initialData?.tags?.map(t => t.id) || [],
        },
    });

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const result = await fileUploadService.upload(file, 'agents');
            if (result.success) {
                setUploadedContract({ name: result.original_name || "Contract", url: result.url });
                form.setValue('contract.signed_agreement_url', result.url);
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
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
                return;
            }
            handleFileUpload(file);
        }
    };

    const removeContract = () => {
        setUploadedContract(null);
        form.setValue('contract.signed_agreement_url', '');
    };

    async function onSubmit(data: z.infer<typeof agentSchema>) {
        setLoading(true);
        try {
            const formData: AgentFormData = {
                agent_name: data.agent_name,
                agent_type: data.agent_type,
                country: data.country,
                city: data.city,
                status: data.status,
                brand_name: data.brand_name || undefined,
                website: data.website || undefined,
                notes: data.notes || undefined,
                contact: data.contact,
                commercial_terms: data.commercial_terms,
                billing_info: data.billing_info,
                contract: data.contract ? {
                    ...data.contract,
                    contract_start_date: data.contract.contract_start_date ? format(data.contract.contract_start_date, 'yyyy-MM-dd') : undefined,
                    contract_end_date: data.contract.contract_end_date ? format(data.contract.contract_end_date, 'yyyy-MM-dd') : undefined,
                    commission_valid_from: data.contract.commission_valid_from ? format(data.contract.commission_valid_from, 'yyyy-MM-dd') : undefined,
                    commission_valid_until: data.contract.commission_valid_until ? format(data.contract.commission_valid_until, 'yyyy-MM-dd') : undefined,
                } : undefined,
                tag_ids: data.tag_ids,
            };

            if (agentId) {
                await agentService.update(Number(agentId), formData);
                router.push("/dashboard/agents");
                router.refresh();
            } else {
                const newAgent = await agentService.create(formData);
                router.push(`/dashboard/agents/${newAgent.id}`);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save agent", error);
            alert("Failed to save agent. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Card 1: Agent Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Agent Information
                        </CardTitle>
                        <CardDescription>Basic details about the agent.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="agent_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agent Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ABC Travel Agency" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="agent_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agent Type *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Travel Agent">Travel Agent</SelectItem>
                                                <SelectItem value="Resort / Guest House">Resort / Guest House</SelectItem>
                                                <SelectItem value="Tour Operator">Tour Operator</SelectItem>
                                                <SelectItem value="Freelancer">Freelancer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Maldives" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Malé" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="brand_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional brand name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes / Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Card 2: Contact Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Contact Details
                        </CardTitle>
                        <CardDescription>Primary contact information.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="contact.contact_person_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contact.job_title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Sales Manager" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contact.preferred_communication_method"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preferred Communication</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Email">Email</SelectItem>
                                                <SelectItem value="Phone">Phone</SelectItem>
                                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="contact.email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="contact@example.com" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contact.phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone / WhatsApp</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="+960 123-4567" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contact.secondary_contact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Secondary Contact</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Alternative contact" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3: Commercial Terms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Commercial Terms
                        </CardTitle>
                        <CardDescription>Commission and payment settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="commercial_terms.commission_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commission Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="commercial_terms.commission_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commission Rate / Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="10.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="commercial_terms.currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="USD" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="commercial_terms.payment_terms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Terms</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select terms" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Prepaid">Prepaid</SelectItem>
                                                <SelectItem value="Weekly">Weekly</SelectItem>
                                                <SelectItem value="Monthly">Monthly</SelectItem>
                                                <SelectItem value="On Invoice">On Invoice</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="commercial_terms.vat_applicable"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>VAT / GST Applicable</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="commercial_terms.tax_registration_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax Registration No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="commercial_terms.credit_limit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Credit Limit</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card 4: Billing Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Billing Information
                        </CardTitle>
                        <CardDescription>Bank and payment details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="billing_info.company_legal_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Legal Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ABC Travel Agency Ltd." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="billing_info.billing_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billing Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Full address..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="billing_info.invoice_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="invoices@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="billing_info.bank_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Bank of Maldives" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="billing_info.account_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Account holder name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="billing_info.account_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="billing_info.swift_iban"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SWIFT / IBAN</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SWIFT code or IBAN" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="billing_info.payment_method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Card 5: Contract Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Contract Details
                        </CardTitle>
                        <CardDescription>Agreement and contract tracking.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contract.contract_start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contract Start Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                selected={field.value ? new Date(field.value) : null}
                                                onChange={(date: Date | null) => field.onChange(date)}
                                                dateFormat="yyyy-MM-dd"
                                                className={cn(
                                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                )}
                                                placeholderText="Select start date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contract.contract_end_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contract End Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                selected={field.value ? new Date(field.value) : null}
                                                onChange={(date: Date | null) => field.onChange(date)}
                                                dateFormat="yyyy-MM-dd"
                                                className={cn(
                                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                )}
                                                placeholderText="Select end date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contract.commission_valid_from"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commission Valid From</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                selected={field.value ? new Date(field.value) : null}
                                                onChange={(date: Date | null) => field.onChange(date)}
                                                dateFormat="yyyy-MM-dd"
                                                className={cn(
                                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                )}
                                                placeholderText="Select date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contract.commission_valid_until"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commission Valid Until</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                selected={field.value ? new Date(field.value) : null}
                                                onChange={(date: Date | null) => field.onChange(date)}
                                                dateFormat="yyyy-MM-dd"
                                                className={cn(
                                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                )}
                                                placeholderText="Select date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="contract.special_conditions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Special Conditions / Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any special terms or conditions..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <FormLabel>Signed Agreement</FormLabel>
                            {uploadedContract ? (
                                <div className="mt-2 flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="flex-1 text-sm">{uploadedContract.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeContract}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                        className="cursor-pointer"
                                    />
                                    {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Card 6: Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TagIcon className="h-5 w-5 text-primary" />
                            Tags
                        </CardTitle>
                        <CardDescription>Organize agents with tags.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => {
                                const isSelected = form.watch('tag_ids')?.includes(tag.id) || false;
                                return (
                                    <Badge
                                        key={tag.id}
                                        variant={isSelected ? "default" : "outline"}
                                        className="cursor-pointer"
                                        style={isSelected && tag.color ? { backgroundColor: tag.color } : {}}
                                        onClick={() => {
                                            const currentIds = form.getValues('tag_ids') || [];
                                            if (isSelected) {
                                                form.setValue('tag_ids', currentIds.filter(id => id !== tag.id));
                                            } else {
                                                form.setValue('tag_ids', [...currentIds, tag.id]);
                                            }
                                        }}
                                    >
                                        {tag.name}
                                    </Badge>
                                );
                            })}
                        </div>
                        {tags.length === 0 && (
                            <p className="text-sm text-muted-foreground">No tags available. Create tags in settings.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : agentId ? "Update Agent" : "Create Agent"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

