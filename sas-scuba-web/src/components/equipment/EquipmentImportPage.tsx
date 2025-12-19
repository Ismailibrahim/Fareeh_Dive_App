"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { equipmentService } from "@/lib/api/services/equipment.service";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Loader2, Download } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface ImportPreview {
    valid: Array<{
        row: number;
        name: string;
        category?: string;
        sizes: string[];
        brands: string[];
        active: boolean;
    }>;
    duplicates: Array<{ row: number; name: string }>;
    errors: Array<{ row: number; name: string; error: string }>;
    summary: {
        total_rows: number;
        valid_count: number;
        duplicate_count: number;
        error_count: number;
    };
}

export function EquipmentImportPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [activeTab, setActiveTab] = useState<"valid" | "duplicates" | "errors">("valid");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
                "application/vnd.ms-excel", // .xls
                "text/csv", // .csv
            ];
            
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
                alert("Please select a valid Excel file (.xlsx, .xls, or .csv)");
                return;
            }

            // Validate file size (10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert("File size must be less than 10MB");
                return;
            }

            setFile(selectedFile);
            setPreview(null);
        }
    };

    const handlePreview = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const result = await equipmentService.importPreview(file);
            setPreview(result);
            if (result.valid.length > 0) {
                setActiveTab("valid");
            } else if (result.errors.length > 0) {
                setActiveTab("errors");
            } else if (result.duplicates.length > 0) {
                setActiveTab("duplicates");
            }
        } catch (error: any) {
            console.error("Failed to preview import", error);
            alert(
                error.response?.data?.message ||
                "Failed to preview import. Please check your file format."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!preview || preview.valid.length === 0) return;

        setImporting(true);
        try {
            const result = await equipmentService.import(preview.valid);
            
            if (result.error_count > 0) {
                alert(
                    `Import completed with errors:\n${result.success_count} succeeded\n${result.error_count} failed`
                );
            } else {
                alert(`Successfully imported ${result.success_count} equipment items!`);
            }
            
            router.push("/dashboard/equipment");
            router.refresh();
        } catch (error: any) {
            console.error("Failed to import equipment", error);
            alert(
                error.response?.data?.message ||
                "Failed to import equipment. Please try again."
            );
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            await equipmentService.downloadTemplate();
        } catch (error: any) {
            console.error("Failed to download template", error);
            const errorMessage = error?.message || 
                               error?.response?.data?.message ||
                               "Failed to download template. Please try again.";
            alert(errorMessage);
        } finally {
            setDownloadingTemplate(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Download Template Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Download Template</CardTitle>
                    <CardDescription>
                        Download our Excel template with sample data and instructions to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                    >
                        {downloadingTemplate ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* File Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Excel File</CardTitle>
                    <CardDescription>
                        Upload an Excel file (.xlsx, .xls, or .csv) to import equipment.
                        The file should have columns: Name (required), Category, Sizes (comma-separated), Brands (comma-separated), Active.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileSpreadsheet className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Excel files (.xlsx, .xls, .csv) up to 10MB
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                        />
                    </label>
                    {file && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="text-sm flex-1">{file.name}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setFile(null)}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {file && !preview && (
                        <Button
                            onClick={handlePreview}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Preview Import
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Preview Results */}
            {preview && (
                <Card>
                    <CardHeader>
                        <CardTitle>Import Preview</CardTitle>
                        <CardDescription>
                            Review the data before importing. Only valid items will be imported.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold text-green-700 dark:text-green-400">
                                        Valid
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                    {preview.summary.valid_count}
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                                        Duplicates
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                                    {preview.summary.duplicate_count}
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="font-semibold text-red-700 dark:text-red-400">
                                        Errors
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                                    {preview.summary.error_count}
                                </p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b">
                            <Button
                                type="button"
                                variant={activeTab === "valid" ? "default" : "ghost"}
                                onClick={() => setActiveTab("valid")}
                                className="rounded-b-none"
                            >
                                Valid ({preview.valid.length})
                            </Button>
                            <Button
                                type="button"
                                variant={activeTab === "duplicates" ? "default" : "ghost"}
                                onClick={() => setActiveTab("duplicates")}
                                className="rounded-b-none"
                            >
                                Duplicates ({preview.duplicates.length})
                            </Button>
                            <Button
                                type="button"
                                variant={activeTab === "errors" ? "default" : "ghost"}
                                onClick={() => setActiveTab("errors")}
                                className="rounded-b-none"
                            >
                                Errors ({preview.errors.length})
                            </Button>
                        </div>

                        {/* Table */}
                        <div className="h-[400px] overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Row</TableHead>
                                        <TableHead>Name</TableHead>
                                        {activeTab === "valid" && (
                                            <>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Sizes</TableHead>
                                                <TableHead>Brands</TableHead>
                                            </>
                                        )}
                                        {activeTab === "errors" && (
                                            <TableHead>Error</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeTab === "valid" &&
                                        preview.valid.map((item) => (
                                            <TableRow key={item.row}>
                                                <TableCell>{item.row}</TableCell>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell>{item.category || "-"}</TableCell>
                                                <TableCell>
                                                    {item.sizes.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.sizes.map((size) => (
                                                                <Badge
                                                                    key={size}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {size}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.brands.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.brands.map((brand) => (
                                                                <Badge
                                                                    key={brand}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {brand}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {activeTab === "duplicates" &&
                                        preview.duplicates.map((item) => (
                                            <TableRow key={item.row}>
                                                <TableCell>{item.row}</TableCell>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell colSpan={3} className="text-muted-foreground">
                                                    Will be skipped (duplicate)
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {activeTab === "errors" &&
                                        preview.errors.map((item) => (
                                            <TableRow key={item.row}>
                                                <TableCell>{item.row}</TableCell>
                                                <TableCell className="font-medium">
                                                    {item.name || "-"}
                                                </TableCell>
                                                <TableCell className="text-destructive">
                                                    {item.error}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {((activeTab === "valid" && preview.valid.length === 0) ||
                                        (activeTab === "duplicates" &&
                                            preview.duplicates.length === 0) ||
                                        (activeTab === "errors" &&
                                            preview.errors.length === 0)) && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-muted-foreground"
                                            >
                                                No items
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Import Button */}
                        {preview.valid.length > 0 && (
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setFile(null);
                                        setPreview(null);
                                        setActiveTab("valid");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={importing}
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        `Import ${preview.valid.length} Equipment`
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

