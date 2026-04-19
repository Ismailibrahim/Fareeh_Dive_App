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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { waiverService, Waiver } from "@/lib/api/services/waiver.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Settings, Calendar } from "lucide-react";

const waiverSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    type: z.enum(["liability", "medical", "checklist", "custom"]),
    description: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    fields: z.array(z.any()).optional(),
    requires_signature: z.boolean().default(true),
    expiry_days: z.number().min(1).max(3650).optional().nullable(),
    require_witness: z.boolean().default(false),
    is_active: z.boolean().default(true),
    display_order: z.number().default(0),
    generate_qr_code: z.boolean().default(false),
});

type WaiverFormData = z.infer<typeof waiverSchema>;

interface WaiverFormProps {
    initialData?: Waiver;
    waiverId?: number;
}

export function WaiverForm({ initialData, waiverId }: WaiverFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<WaiverFormData>({
        resolver: zodResolver(waiverSchema),
        defaultValues: initialData || {
            type: "custom",
            requires_signature: true,
            require_witness: false,
            is_active: true,
            display_order: 0,
            generate_qr_code: false,
            content: "",
        },
    });

    const requiresSignature = form.watch("requires_signature");

    const onSubmit = async (data: WaiverFormData) => {
        setLoading(true);
        try {
            if (waiverId) {
                await waiverService.update(waiverId, data);
                toast.success("Waiver updated successfully");
            } else {
                await waiverService.create(data);
                toast.success("Waiver created successfully");
            }
            router.push("/dashboard/waivers");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save waiver");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Basic Information
                        </CardTitle>
                        <CardDescription>Enter the basic details for this waiver.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Waiver Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Liability Release, PADI Medical Questionnaire" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select waiver type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="liability">Liability Release</SelectItem>
                                            <SelectItem value="medical">Medical Questionnaire</SelectItem>
                                            <SelectItem value="checklist">Pre-Dive Checklist</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of this waiver..."
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

                {/* Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Waiver Content
                        </CardTitle>
                        <CardDescription>The main content of the waiver form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter the waiver content. You can use HTML formatting."
                                            className="min-h-[200px] font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Enter the waiver text. HTML formatting is supported.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="h-4 w-4 text-primary" />
                            Settings
                        </CardTitle>
                        <CardDescription>Configure waiver behavior and requirements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="requires_signature"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Requires Signature</FormLabel>
                                        <FormDescription>
                                            Whether this waiver requires a digital signature.
                                        </FormDescription>
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

                        {requiresSignature && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="expiry_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Days (optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g., 365 for 1 year"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value === "" ? null : parseInt(value, 10));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Number of days until the signature expires. Leave empty for no expiry.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="require_witness"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Require Witness</FormLabel>
                                                <FormDescription>
                                                    Whether a witness signature is required.
                                                </FormDescription>
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
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="display_order"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Order</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Lower numbers appear first in lists.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active</FormLabel>
                                        <FormDescription>
                                            Only active waivers are shown to customers.
                                        </FormDescription>
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

                        <FormField
                            control={form.control}
                            name="generate_qr_code"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Generate QR Code</FormLabel>
                                        <FormDescription>
                                            Generate a QR code for quick customer check-in.
                                        </FormDescription>
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

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : waiverId ? "Update Waiver" : "Create Waiver"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
