"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Check, X, Copy, ExternalLink, AlertCircle, User, Mail, Phone, Calendar, Award, Building, MapPin, Download, QrCode, Trash2, CheckCircle2 } from "lucide-react";
import { preRegistrationService, PreRegistrationSubmission, PreRegistrationSubmissionDetail, PreRegistrationLink } from "@/lib/api/services/pre-registration.service";
import { safeFormatDate } from "@/lib/utils/date-format";
import dynamic from "next/dynamic";

// Lazy load QRCode component to reduce initial bundle size
const QRCode = dynamic(() => import("react-qr-code"), {
    loading: () => <div className="w-32 h-32 bg-gray-100 animate-pulse rounded" />,
    ssr: false,
});

export default function PreRegistrationsPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<PreRegistrationSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<PreRegistrationSubmissionDetail | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectNotes, setRejectNotes] = useState("");
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expiresInDays, setExpiresInDays] = useState("30");
    const [newLink, setNewLink] = useState<{ url: string; expires_at: string } | null>(null);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showBulkGenerateDialog, setShowBulkGenerateDialog] = useState(false);
    const [bulkQuantity, setBulkQuantity] = useState("10");
    const [generatingBulkLinks, setGeneratingBulkLinks] = useState(false);
    const [bulkLinks, setBulkLinks] = useState<PreRegistrationLink[]>([]);
    const [showBulkLinksDialog, setShowBulkLinksDialog] = useState(false);
    const [pendingLinks, setPendingLinks] = useState<PreRegistrationLink[]>([]);
    const [loadingPendingLinks, setLoadingPendingLinks] = useState(false);
    const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState<PreRegistrationLink | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    useEffect(() => {
        fetchSubmissions();
        fetchPendingLinks();
    }, [statusFilter, searchQuery, pagination.current_page]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await preRegistrationService.getSubmissions({
                status: statusFilter || undefined,
                search: searchQuery || undefined,
                page: pagination.current_page,
                per_page: pagination.per_page,
            });
            setSubmissions(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
            });
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingLinks = async () => {
        try {
            setLoadingPendingLinks(true);
            const response = await preRegistrationService.getPendingLinks({
                per_page: 50,
            });
            setPendingLinks(response.data);
        } catch (error) {
            console.error("Failed to fetch pending links", error);
        } finally {
            setLoadingPendingLinks(false);
        }
    };

    const handleDeleteClick = (link: PreRegistrationLink) => {
        setLinkToDelete(link);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!linkToDelete) return;

        try {
            setDeletingLinkId(linkToDelete.id);
            await preRegistrationService.deleteLink(linkToDelete.id);
            fetchPendingLinks(); // Refresh the list
            setSuccessMessage("Link deleted successfully!");
            setDeleteDialogOpen(false);
            setLinkToDelete(null);
            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Failed to delete link", error);
            setErrorMessage("Failed to delete link. Please try again.");
            // Clear error message after 5 seconds
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setDeletingLinkId(null);
        }
    };

    const generateLink = async () => {
        try {
            setGeneratingLink(true);
            const link = await preRegistrationService.generateLink(parseInt(expiresInDays));
            setNewLink({
                url: link.url,
                expires_at: link.expires_at,
            });
            setShowLinkDialog(true);
            fetchPendingLinks(); // Refresh pending links
        } catch (error) {
            console.error("Failed to generate link", error);
            setErrorMessage("Failed to generate link. Please try again.");
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleBulkGenerateClick = () => {
        setBulkQuantity("10"); // Reset to default
        setShowBulkGenerateDialog(true);
    };

    const generateBulkLinks = async () => {
        const quantityNum = parseInt(bulkQuantity);
        if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 100) {
            setErrorMessage("Please enter a valid quantity between 1 and 100.");
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }

        try {
            setGeneratingBulkLinks(true);
            const response = await preRegistrationService.generateBulkLinks(quantityNum, parseInt(expiresInDays));
            setBulkLinks(response.links);
            setShowBulkGenerateDialog(false);
            setShowBulkLinksDialog(true);
            fetchPendingLinks(); // Refresh pending links
        } catch (error) {
            console.error("Failed to generate bulk links", error);
            setErrorMessage("Failed to generate links. Please try again.");
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setGeneratingBulkLinks(false);
        }
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        setSuccessMessage("Link copied to clipboard!");
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const copyAllLinks = () => {
        const allUrls = bulkLinks.map(link => link.url).join('\n');
        navigator.clipboard.writeText(allUrls);
        setSuccessMessage(`Copied ${bulkLinks.length} link(s) to clipboard!`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const exportLinksAsCSV = () => {
        const csvContent = [
            ['URL', 'Token', 'Expires At', 'Created At'],
            ...bulkLinks.map(link => [
                link.url,
                link.token,
                link.expires_at,
                link.created_at
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `registration-links-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadQRCode = () => {
        if (!qrCodeRef.current || !newLink) return;

        const svg = qrCodeRef.current.querySelector('svg');
        if (!svg) return;

        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            if (!ctx) {
                URL.revokeObjectURL(url);
                return;
            }

            canvas.width = 512;
            canvas.height = 512;

            img.onload = () => {
                try {
                    ctx.drawImage(img, 0, 0, 512, 512);
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            URL.revokeObjectURL(url);
                            return;
                        }
                        const downloadUrl = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = downloadUrl;
                        link.download = `registration-qr-code-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(downloadUrl);
                        URL.revokeObjectURL(url);
                    }, 'image/png');
                } catch (error) {
                    console.error('Error drawing image to canvas:', error);
                    URL.revokeObjectURL(url);
                }
            };

            img.onerror = () => {
                console.error('Error loading image');
                URL.revokeObjectURL(url);
            };

            img.src = url;
                } catch (error) {
                    console.error('Error downloading QR code:', error);
                    setErrorMessage('Failed to download QR code. Please try again.');
                    setTimeout(() => setErrorMessage(null), 5000);
                }
    };

    const viewSubmission = async (id: number) => {
        try {
            const submission = await preRegistrationService.getSubmission(id);
            setSelectedSubmission(submission);
            setShowDetailsDialog(true);
        } catch (error) {
            console.error("Failed to fetch submission details", error);
        }
    };

    const approveSubmission = async () => {
        if (!selectedSubmission) return;
        try {
            setApproving(true);
            await preRegistrationService.approve(selectedSubmission.id);
            setShowDetailsDialog(false);
            setSelectedSubmission(null);
            fetchSubmissions();
            setSuccessMessage("Submission approved successfully!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Failed to approve submission", error);
            setErrorMessage("Failed to approve submission. Please try again.");
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setApproving(false);
        }
    };

    const rejectSubmission = async () => {
        if (!selectedSubmission || !rejectNotes.trim()) {
            setErrorMessage("Please provide rejection notes.");
            setTimeout(() => setErrorMessage(null), 5000);
            return;
        }
        try {
            setRejecting(true);
            await preRegistrationService.reject(selectedSubmission.id, rejectNotes);
            setShowRejectDialog(false);
            setShowDetailsDialog(false);
            setSelectedSubmission(null);
            setRejectNotes("");
            fetchSubmissions();
            setSuccessMessage("Submission rejected successfully!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Failed to reject submission", error);
            setErrorMessage("Failed to reject submission. Please try again.");
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setRejecting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-500">Approved</Badge>;
            case "rejected":
                return <Badge className="bg-red-500">Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-500">Pending</Badge>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Pre-Registrations" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Success/Error Messages */}
                {successMessage && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-300">
                            {successMessage}
                        </AlertDescription>
                    </Alert>
                )}
                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                )}
                {/* Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Pre-Registration Management</h2>
                        <p className="text-muted-foreground">Manage customer pre-registration links and review submissions</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Label>Expires in:</Label>
                            <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="14">14 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="60">60 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={generateLink} disabled={generatingLink || generatingBulkLinks} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            {generatingLink ? "Generating..." : "Generate 1 Link"}
                        </Button>
                        <Button onClick={handleBulkGenerateClick} disabled={generatingLink || generatingBulkLinks}>
                            <Plus className="h-4 w-4 mr-2" />
                            Bulk Generate
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPagination({ ...pagination, current_page: 1 });
                                }}
                                className="flex-1"
                            />
                            <Select value={statusFilter || "all"} onValueChange={(value) => {
                                setStatusFilter(value === "all" ? "" : value);
                                setPagination({ ...pagination, current_page: 1 });
                            }}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Links Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Links</CardTitle>
                        <CardDescription>Generated links that have not been submitted yet</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingPendingLinks ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : pendingLinks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No pending links found.
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>URL</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingLinks.map((link) => (
                                            <TableRow key={link.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Input value={link.url} readOnly className="font-mono text-sm" />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyLink(link.url)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {safeFormatDate(link.created_at, "PPp")}
                                                </TableCell>
                                                <TableCell>
                                                    {safeFormatDate(link.expires_at, "PPp")}
                                                </TableCell>
                                                <TableCell>
                                                    {link.is_expired ? (
                                                        <Badge className="bg-red-500">Expired</Badge>
                                                    ) : (
                                                        <Badge className="bg-green-500">Active</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(link)}
                                                        disabled={deletingLinkId === link.id}
                                                    >
                                                        {deletingLinkId === link.id ? (
                                                            "Deleting..."
                                                        ) : (
                                                            <>
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submissions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submissions</CardTitle>
                        <CardDescription>Review and approve customer pre-registrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No submissions found.
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {submissions.map((submission) => (
                                                <TableRow key={submission.id}>
                                                    <TableCell className="font-medium">
                                                        {submission.customer_name}
                                                    </TableCell>
                                                    <TableCell>{submission.customer_email || "N/A"}</TableCell>
                                                    <TableCell>
                                                        {safeFormatDate(submission.submitted_at, "PPp")}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => viewSubmission(submission.id)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Mobile View */}
                                <div className="grid grid-cols-1 md:hidden gap-4 mt-4">
                                    {submissions.map((submission) => (
                                        <Card key={submission.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">{submission.customer_name}</CardTitle>
                                                        <CardDescription>{submission.customer_email || "No email"}</CardDescription>
                                                    </div>
                                                    {getStatusBadge(submission.status)}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="font-medium">Submitted: </span>
                                                        {safeFormatDate(submission.submitted_at, "PPp")}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => viewSubmission(submission.id)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{" "}
                                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                                            {pagination.total} submissions
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page === 1}
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page === pagination.last_page}
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Generate Link Dialog */}
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registration Link Generated</DialogTitle>
                        <DialogDescription>
                            Share this link with your customer via WhatsApp, Email, or display as QR code.
                        </DialogDescription>
                    </DialogHeader>
                    {newLink && (
                        <div className="space-y-4">
                            <div>
                                <Label>Registration URL</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input value={newLink.url} readOnly />
                                    <Button variant="outline" onClick={() => copyLink(newLink.url)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Expires on: {safeFormatDate(newLink.expires_at, "PPp")}
                            </div>

                            {/* QR Code Section */}
                            <div className="border rounded-lg p-4 bg-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <QrCode className="h-5 w-5 text-primary" />
                                    <Label className="text-base font-semibold">QR Code</Label>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div 
                                        ref={qrCodeRef}
                                        className="p-4 bg-white rounded-lg border-2 border-gray-200"
                                        style={{ 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            minHeight: '256px',
                                            minWidth: '256px'
                                        }}
                                    >
                                        <QRCode
                                            value={newLink.url}
                                            size={256}
                                            level="H"
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={downloadQRCode}
                                        className="w-full"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download QR Code
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(newLink.url)}`;
                                        window.open(whatsappUrl, "_blank");
                                    }}
                                >
                                    Share via WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        window.location.href = `mailto:?body=${encodeURIComponent(newLink.url)}`;
                                    }}
                                >
                                    Share via Email
                                </Button>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowLinkDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submission Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Submission Details</DialogTitle>
                        <DialogDescription>
                            Review all submitted information before approving or rejecting.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSubmission && (
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Customer Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Full Name</Label>
                                        <p>{selectedSubmission.customer_data.full_name}</p>
                                    </div>
                                    {selectedSubmission.customer_data.email && (
                                        <div>
                                            <Label className="text-muted-foreground">Email</Label>
                                            <p>{selectedSubmission.customer_data.email}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.phone && (
                                        <div>
                                            <Label className="text-muted-foreground">Phone</Label>
                                            <p>{selectedSubmission.customer_data.phone}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.passport_no && (
                                        <div>
                                            <Label className="text-muted-foreground">Passport</Label>
                                            <p>{selectedSubmission.customer_data.passport_no}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.nationality && (
                                        <div>
                                            <Label className="text-muted-foreground">Nationality</Label>
                                            <p>{selectedSubmission.customer_data.nationality}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.gender && (
                                        <div>
                                            <Label className="text-muted-foreground">Gender</Label>
                                            <p>{selectedSubmission.customer_data.gender}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.date_of_birth && (
                                        <div>
                                            <Label className="text-muted-foreground">Date of Birth</Label>
                                            <p>{safeFormatDate(selectedSubmission.customer_data.date_of_birth, "PPP")}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.address && (
                                        <div className="col-span-2">
                                            <Label className="text-muted-foreground">Address</Label>
                                            <p>{selectedSubmission.customer_data.address}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.city && (
                                        <div>
                                            <Label className="text-muted-foreground">City</Label>
                                            <p>{selectedSubmission.customer_data.city}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.zip_code && (
                                        <div>
                                            <Label className="text-muted-foreground">Zip Code</Label>
                                            <p>{selectedSubmission.customer_data.zip_code}</p>
                                        </div>
                                    )}
                                    {selectedSubmission.customer_data.country && (
                                        <div>
                                            <Label className="text-muted-foreground">Country</Label>
                                            <p>{selectedSubmission.customer_data.country}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Emergency Contacts */}
                            {selectedSubmission.emergency_contacts_data && selectedSubmission.emergency_contacts_data.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Emergency Contacts
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {selectedSubmission.emergency_contacts_data.map((contact, index) => (
                                            <div key={index} className="border rounded p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {contact.name && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Name</Label>
                                                            <p>{contact.name}</p>
                                                        </div>
                                                    )}
                                                    {contact.email && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Email</Label>
                                                            <p>{contact.email}</p>
                                                        </div>
                                                    )}
                                                    {contact.phone_1 && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Phone 1</Label>
                                                            <p>{contact.phone_1}</p>
                                                        </div>
                                                    )}
                                                    {contact.relationship && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Relationship</Label>
                                                            <p>{contact.relationship}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Certifications */}
                            {selectedSubmission.certifications_data && selectedSubmission.certifications_data.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Award className="h-5 w-5" />
                                            Certifications
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {selectedSubmission.certifications_data.map((cert, index) => (
                                            <div key={index} className="border rounded p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-muted-foreground">Certification</Label>
                                                        <p>{cert.certification_name}</p>
                                                    </div>
                                                    {cert.certification_no && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Number</Label>
                                                            <p>{cert.certification_no}</p>
                                                        </div>
                                                    )}
                                                    {cert.certification_date && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Date</Label>
                                                            <p>{safeFormatDate(cert.certification_date, "PPP")}</p>
                                                        </div>
                                                    )}
                                                    {cert.agency && (
                                                        <div>
                                                            <Label className="text-muted-foreground">Agency</Label>
                                                            <p>{cert.agency}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Insurance */}
                            {selectedSubmission.insurance_data && Object.keys(selectedSubmission.insurance_data).length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building className="h-5 w-5" />
                                            Insurance
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                        {selectedSubmission.insurance_data.insurance_provider && (
                                            <div>
                                                <Label className="text-muted-foreground">Provider</Label>
                                                <p>{selectedSubmission.insurance_data.insurance_provider}</p>
                                            </div>
                                        )}
                                        {selectedSubmission.insurance_data.insurance_no && (
                                            <div>
                                                <Label className="text-muted-foreground">Number</Label>
                                                <p>{selectedSubmission.insurance_data.insurance_no}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Accommodation */}
                            {selectedSubmission.accommodation_data && Object.keys(selectedSubmission.accommodation_data).length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Accommodation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                        {selectedSubmission.accommodation_data.name && (
                                            <div>
                                                <Label className="text-muted-foreground">Name</Label>
                                                <p>{selectedSubmission.accommodation_data.name}</p>
                                            </div>
                                        )}
                                        {selectedSubmission.accommodation_data.address && (
                                            <div>
                                                <Label className="text-muted-foreground">Address</Label>
                                                <p>{selectedSubmission.accommodation_data.address}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex justify-end gap-2">
                                {selectedSubmission.status === "pending" && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            onClick={() => setShowRejectDialog(true)}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                        <Button onClick={approveSubmission} disabled={approving}>
                                            <Check className="h-4 w-4 mr-2" />
                                            {approving ? "Approving..." : "Approve"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Submission</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This will be recorded with the submission.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Rejection Notes *</Label>
                            <Textarea
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={rejectSubmission}
                            disabled={rejecting || !rejectNotes.trim()}
                        >
                            {rejecting ? "Rejecting..." : "Reject Submission"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Links Dialog */}
            <Dialog open={showBulkLinksDialog} onOpenChange={setShowBulkLinksDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Generated Registration Links</DialogTitle>
                        <DialogDescription>
                            {bulkLinks.length} link(s) generated successfully. Copy individual links or export all as CSV.
                        </DialogDescription>
                    </DialogHeader>
                    {bulkLinks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={copyAllLinks}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy All Links
                                </Button>
                                <Button variant="outline" onClick={exportLinksAsCSV}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Expires on: {safeFormatDate(bulkLinks[0]?.expires_at, "PPp")}
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>URL</TableHead>
                                            <TableHead className="w-24">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bulkLinks.map((link, index) => (
                                            <TableRow key={link.id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Input value={link.url} readOnly className="font-mono text-sm" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyLink(link.url)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowBulkLinksDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Generate Dialog */}
            <Dialog open={showBulkGenerateDialog} onOpenChange={setShowBulkGenerateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Generate Links</DialogTitle>
                        <DialogDescription>
                            Enter the number of registration links you want to generate. All links will expire in {expiresInDays} days.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="bulk-quantity">Quantity</Label>
                            <Input
                                id="bulk-quantity"
                                type="number"
                                min="1"
                                max="100"
                                value={bulkQuantity}
                                onChange={(e) => setBulkQuantity(e.target.value)}
                                placeholder="10"
                                className="mt-2"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter a number between 1 and 100
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkGenerateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={generateBulkLinks} disabled={generatingBulkLinks}>
                            {generatingBulkLinks ? "Generating..." : `Generate ${bulkQuantity || "0"} Links`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the registration link
                            {linkToDelete && (
                                <>
                                    <br />
                                    <strong className="font-mono text-xs mt-2 block">{linkToDelete.url}</strong>
                                </>
                            )}
                            and it will no longer be accessible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setLinkToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

