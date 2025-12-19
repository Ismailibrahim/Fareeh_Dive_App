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
import { diveSiteService, DiveSiteFormData, DiveSite } from "@/lib/api/services/dive-site.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Ruler, FileText, Navigation, Users, Upload, X, File } from "lucide-react";
import { fileUploadService } from "@/lib/api/services/file-upload.service";

const diveSiteSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    max_depth: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    latitude: z.string().optional().or(z.literal("")),
    longitude: z.string().optional().or(z.literal("")),
    location: z.string().optional().or(z.literal("")),
    pax_capacity: z.string().optional().or(z.literal("")),
    attachment: z.string().optional().or(z.literal("")),
});

interface DiveSiteFormProps {
    initialData?: DiveSite;
    diveSiteId?: string | number;
}

export function DiveSiteForm({ initialData, diveSiteId }: DiveSiteFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

    const form = useForm<z.infer<typeof diveSiteSchema>>({
        resolver: zodResolver(diveSiteSchema),
        defaultValues: {
            name: initialData?.name || "",
            max_depth: initialData?.max_depth ? String(initialData.max_depth) : "",
            description: initialData?.description || "",
            latitude: initialData?.latitude ? String(initialData.latitude) : "",
            longitude: initialData?.longitude ? String(initialData.longitude) : "",
            location: initialData?.location || "",
            pax_capacity: initialData?.pax_capacity ? String(initialData.pax_capacity) : "",
            attachment: initialData?.attachment || "",
        },
    });

    useEffect(() => {
        if (initialData?.attachment) {
            setUploadedFile({ name: 'Current file', url: initialData.attachment });
        }
    }, [initialData]);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const result = await fileUploadService.upload(file);
            if (result.success) {
                form.setValue('attachment', result.url);
                setUploadedFile({ name: result.original_name || file.name, url: result.url });
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
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('File type not allowed. Please upload PDF, JPG, or PNG files.');
                return;
            }
            handleFileUpload(file);
        }
    };

    const removeFile = () => {
        form.setValue('attachment', '');
        setUploadedFile(null);
    };

    async function onSubmit(data: z.infer<typeof diveSiteSchema>) {
        setLoading(true);
        try {
            const payload: DiveSiteFormData = {
                name: data.name,
                max_depth: data.max_depth ? parseInt(data.max_depth) : undefined,
                description: data.description || undefined,
                latitude: data.latitude ? parseFloat(data.latitude) : undefined,
                longitude: data.longitude ? parseFloat(data.longitude) : undefined,
                location: data.location || undefined,
                pax_capacity: data.pax_capacity ? parseInt(data.pax_capacity) : undefined,
                attachment: data.attachment || undefined,
            };

            if (diveSiteId) {
                await diveSiteService.update(Number(diveSiteId), payload);
            } else {
                await diveSiteService.create(payload);
            }
            router.push("/dashboard/dive-sites");
            router.refresh();
        } catch (error) {
            console.error("Failed to save dive site", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Dive Site Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Dive Site Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about the dive site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dive Site Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g., Blue Hole, Shark Reef" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="max_depth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Maximum Depth (meters)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g., 30" 
                                                    className="pl-9" 
                                                    {...field}
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pax_capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pax Capacity</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g., 20" 
                                                    className="pl-9" 
                                                    {...field}
                                                    min="1"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g., Red Sea, Sharm El Sheikh" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Latitude</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g., 27.9158" 
                                                    className="pl-9" 
                                                    {...field}
                                                    step="any"
                                                    min="-90"
                                                    max="90"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Longitude</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g., 34.3296" 
                                                    className="pl-9" 
                                                    {...field}
                                                    step="any"
                                                    min="-180"
                                                    max="180"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Textarea 
                                                placeholder="Enter a description of the dive site, including notable features, marine life, difficulty level, etc." 
                                                className="pl-9 min-h-[100px]" 
                                                {...field} 
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Photo or PDF Attachment</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            {uploadedFile ? (
                                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                                                    <File className="h-5 w-5 text-muted-foreground" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                                                        {uploadedFile.url && (
                                                            <a 
                                                                href={uploadedFile.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-muted-foreground hover:underline"
                                                            >
                                                                View file
                                                            </a>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={removeFile}
                                                        className="h-8 w-8"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed rounded-lg p-6">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                        <div className="text-center">
                                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                                <span className="text-sm font-medium text-primary hover:underline">
                                                                    Click to upload
                                                                </span>
                                                                <span className="text-sm text-muted-foreground"> or drag and drop</span>
                                                            </label>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                PDF, PNG, JPG up to 10MB
                                                            </p>
                                                        </div>
                                                        <input
                                                            id="file-upload"
                                                            type="file"
                                                            accept=".pdf,.png,.jpg,.jpeg"
                                                            onChange={handleFileChange}
                                                            className="hidden"
                                                            disabled={uploading}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {uploading && (
                                                <p className="text-sm text-muted-foreground">Uploading...</p>
                                            )}
                                        </div>
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
                        {loading ? "Saving..." : (diveSiteId ? "Update Dive Site" : "Create Dive Site")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

