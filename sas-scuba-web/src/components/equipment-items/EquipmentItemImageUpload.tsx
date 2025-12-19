"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { fileUploadService } from "@/lib/api/services/file-upload.service";
import { resizeImage } from "@/lib/utils/image-resize";
import Image from "next/image";

interface EquipmentItemImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

export function EquipmentItemImageUpload({
    value,
    onChange,
    onError,
    disabled = false,
}: EquipmentItemImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update preview when value prop changes
    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleFileSelect = async (file: File) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            onError?.('Please upload a JPG or PNG image file.');
            return;
        }

        // Validate file size (10MB max before resize)
        if (file.size > 10 * 1024 * 1024) {
            onError?.('File size must be less than 10MB.');
            return;
        }

        setUploading(true);
        try {
            // Resize image client-side
            const resizedFile = await resizeImage(file, 300);
            
            // Upload resized image
            const result = await fileUploadService.upload(resizedFile, 'equipment-items');
            
            if (result.success) {
                onChange(result.url);
                setPreview(result.url);
            } else {
                onError?.(result.message || 'Failed to upload image');
            }
        } catch (error: any) {
            console.error('Image upload error:', error);
            onError?.(error?.response?.data?.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = () => {
        onChange('');
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {preview ? (
                <div className="relative inline-block">
                    <div className="relative w-40 h-40 rounded-lg border-2 border-border overflow-hidden bg-muted">
                        <Image
                            src={preview}
                            alt="Equipment thumbnail"
                            fill
                            className="object-cover"
                            sizes="160px"
                        />
                    </div>
                    {!disabled && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove image</span>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center w-40 h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    disabled={disabled || uploading}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleButtonClick}
                    disabled={disabled || uploading}
                    className="w-full"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : preview ? 'Replace Image' : 'Upload Image'}
                </Button>
                <p className="text-xs text-muted-foreground">
                    JPG or PNG. Max 10MB. Will be resized to max 300px.
                </p>
            </div>
        </div>
    );
}

