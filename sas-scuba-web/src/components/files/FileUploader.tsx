"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fileService, FileUploadResponse } from "@/lib/api/services/file.service";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploaderProps {
    entityType: string;
    entityId: string;
    category: string;
    onUploadComplete?: (result: FileUploadResponse) => void;
    onUploadError?: (error: string) => void;
    multiple?: boolean;
    maxFiles?: number;
    buttonText?: string;
    showInfo?: boolean;
    className?: string;
}

// Category-specific info
const categoryInfo: Record<string, { types: string[]; maxSize: string }> = {
    "customer-photo": { types: ["JPEG", "PNG", "WebP"], maxSize: "5MB" },
    "dive-certificate": { types: ["JPEG", "PNG", "PDF"], maxSize: "10MB" },
    "insurance-card": { types: ["JPEG", "PNG", "PDF"], maxSize: "5MB" },
    "equipment-photo": { types: ["JPEG", "PNG", "WebP"], maxSize: "10MB" },
    "dive-site-map": { types: ["JPEG", "PNG", "PDF"], maxSize: "15MB" },
    "service-receipt": { types: ["JPEG", "PNG", "PDF"], maxSize: "5MB" },
    invoice: { types: ["PDF", "JPEG", "PNG"], maxSize: "5MB" },
};

export function FileUploader({
    entityType,
    entityId,
    category,
    onUploadComplete,
    onUploadError,
    multiple = false,
    maxFiles = 1,
    buttonText = "Upload File",
    showInfo = true,
    className,
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleUpload = useCallback(
        async (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            
            if (!multiple && fileArray.length > 1) {
                setError("Only one file is allowed");
                return;
            }

            if (fileArray.length > maxFiles) {
                setError(`Maximum ${maxFiles} file(s) allowed`);
                return;
            }

            setError(null);
            setUploading(true);
            setProgress(0);

            let progressInterval: NodeJS.Timeout | null = null;
            
            try {
                const uploadPromises = fileArray.map((file) =>
                    fileService.upload(file, entityType, entityId, category)
                );

                // Simulate progress (in real app, you'd use XMLHttpRequest for actual progress)
                progressInterval = setInterval(() => {
                    setProgress((prev) => Math.min(prev + 10, 90));
                }, 100);

                const results = await Promise.all(uploadPromises);
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
                setProgress(100);

                results.forEach((result) => {
                    if (result.success) {
                        onUploadComplete?.(result);
                    } else {
                        onUploadError?.(result.message || "Upload failed");
                    }
                });

                // Reset after a short delay
                setTimeout(() => {
                    setProgress(0);
                    setUploading(false);
                }, 500);
            } catch (err: any) {
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Upload failed. Please try again.";
                setError(errorMessage);
                onUploadError?.(errorMessage);
                setUploading(false);
                setProgress(0);
            }
        },
        [entityType, entityId, category, multiple, maxFiles, onUploadComplete, onUploadError]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleUpload(e.dataTransfer.files);
            }
        },
        [handleUpload]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files);
            }
        },
        [handleUpload]
    );

    const info = categoryInfo[category];

    return (
        <div className={cn("space-y-4", className)}>
            {showInfo && info && (
                <Alert>
                    <AlertDescription>
                        <div className="text-sm">
                            <p className="font-medium">Accepted file types: {info.types.join(", ")}</p>
                            <p className="text-muted-foreground">Maximum file size: {info.maxSize}</p>
                            {category === "customer-photo" && (
                                <p className="text-muted-foreground">Minimum dimensions: 200x200px</p>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25",
                    uploading && "opacity-50 pointer-events-none"
                )}
            >
                <input
                    type="file"
                    id={`file-upload-${entityType}-${entityId}`}
                    className="hidden"
                    onChange={handleFileInput}
                    multiple={multiple}
                    disabled={uploading}
                />
                <label
                    htmlFor={`file-upload-${entityType}-${entityId}`}
                    className="cursor-pointer"
                >
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                {dragActive ? "Drop files here" : "Drag and drop files here"}
                            </p>
                            <p className="text-xs text-muted-foreground">or click to browse</p>
                        </div>
                    </div>
                </label>
            </div>

            {uploading && (
                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-xs text-center text-muted-foreground">
                        Uploading... {progress}%
                    </p>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setError(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

