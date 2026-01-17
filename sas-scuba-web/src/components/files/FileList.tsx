"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { fileService, FileInfo } from "@/lib/api/services/file.service";
import { Download, Trash2, File, Image as ImageIcon, FileText } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface FileListProps {
    entityType: string;
    entityId: string;
    category?: string;
    onFileDeleted?: () => void;
    showPreview?: boolean;
    className?: string;
}

export function FileList({
    entityType,
    entityId,
    category,
    onFileDeleted,
    showPreview = true,
    className,
}: FileListProps) {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);

    useEffect(() => {
        loadFiles();
    }, [entityType, entityId, category]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const fileList = await fileService.list(entityType, entityId, category);
            setFiles(fileList);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load files"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (file: FileInfo) => {
        setFileToDelete(file);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;

        try {
            await fileService.delete(fileToDelete.id);
            setFiles(files.filter((f) => f.id !== fileToDelete.id));
            onFileDeleted?.();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to delete file"
            );
        } finally {
            setShowDeleteDialog(false);
            setFileToDelete(null);
        }
    };

    const handleDownload = async (file: FileInfo) => {
        try {
            await fileService.download(file.id, file.originalName);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to download file"
            );
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return <ImageIcon className="h-4 w-4" />;
        }
        if (mimeType === "application/pdf") {
            return <FileText className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
    };

    if (loading) {
        return (
            <div className="text-center py-4 text-muted-foreground">
                Loading files...
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (files.length === 0) {
        return (
            <div className="text-center py-4 text-muted-foreground">
                No files uploaded yet
            </div>
        );
    }

    return (
        <>
            <div className={className}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>File</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => (
                            <TableRow key={file.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getFileIcon(file.mimeType)}
                                        <div>
                                            <div className="font-medium">
                                                {file.originalName}
                                            </div>
                                            {showPreview && file.mimeType.startsWith("image/") && (
                                                <img
                                                    src={file.url}
                                                    alt={file.originalName}
                                                    className="mt-2 h-16 w-16 object-cover rounded"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                                <TableCell>
                                    {safeFormatDate(file.createdAt, "MMM d, yyyy", "N/A")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleDownload(file)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleDelete(file)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{fileToDelete?.originalName}"? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

