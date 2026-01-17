"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, CreditCard, Banknote, Wallet, MoreHorizontal, Coins, ChevronDown, Percent } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { paymentMethodService, PaymentMethod, PaymentMethodType, CreatePaymentMethodRequest, UpdatePaymentMethodRequest } from "@/lib/api/services/payment-method.service";
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
import { Pagination } from "@/components/ui/pagination";

const paymentMethodSchema = z.object({
    method_type: z.enum(['Bank Transfer', 'Crypto', 'Credit Card', 'Wallet', 'Cash']),
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    is_active: z.boolean(),
    fee_percentage: z.number().min(0).max(100).optional(),
    // Method-specific settings
    currency: z.string().optional(),
    terminal_id: z.string().optional(),
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    wallet_type: z.string().optional(),
    crypto_type: z.string().optional(),
    description: z.string().optional(),
});

const methodTypeIcons: Record<PaymentMethodType, typeof CreditCard> = {
    'Credit Card': CreditCard,
    'Cash': Banknote,
    'Bank Transfer': Wallet,
    'Wallet': Wallet,
    'Crypto': Coins,
};

export function PaymentMethodsList() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<z.infer<typeof paymentMethodSchema>>({
        resolver: zodResolver(paymentMethodSchema),
        defaultValues: {
            method_type: 'Cash',
            name: "",
            is_active: true,
            fee_percentage: 0,
            currency: "",
            terminal_id: "",
            bank_name: "",
            account_number: "",
            wallet_type: "",
            crypto_type: "",
            description: "",
        },
    });

    const methodType = form.watch("method_type");

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            setLoading(true);
            // Fetch all methods including inactive ones
            const data = await paymentMethodService.getAll({ is_active: undefined });
            setMethods(data);
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingMethod(null);
        setAdvancedSettingsOpen(false);
        form.reset({
            method_type: 'Cash',
            name: "",
            is_active: true,
            fee_percentage: 0,
            currency: "",
            terminal_id: "",
            bank_name: "",
            account_number: "",
            wallet_type: "",
            crypto_type: "",
            description: "",
        });
        setDialogOpen(true);
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setAdvancedSettingsOpen(false);
        const settings = method.settings || {};
        form.reset({
            method_type: method.method_type,
            name: method.name,
            is_active: method.is_active,
            fee_percentage: settings.fee_percentage || 0,
            currency: settings.currency || "",
            terminal_id: settings.terminal_id || "",
            bank_name: settings.bank_name || "",
            account_number: settings.account_number || "",
            wallet_type: settings.wallet_type || "",
            crypto_type: settings.crypto_type || "",
            description: settings.description || "",
        });
        setDialogOpen(true);
    };

    const handleDelete = (method: PaymentMethod) => {
        setMethodToDelete(method);
        setDeleteDialogOpen(true);
    };

    const onSubmit = async (data: z.infer<typeof paymentMethodSchema>) => {
        try {
            // Build settings object from form data
            const settings: Record<string, any> = {};
            
            if (data.fee_percentage && data.fee_percentage > 0) {
                settings.fee_percentage = data.fee_percentage;
            }
            
            if (data.description) {
                settings.description = data.description;
            }

            // Method-specific settings
            if (data.method_type === 'Cash' && data.currency) {
                settings.currency = data.currency;
            }
            
            if (data.method_type === 'Credit Card' && data.terminal_id) {
                settings.terminal_id = data.terminal_id;
            }
            
            if (data.method_type === 'Bank Transfer') {
                if (data.bank_name) settings.bank_name = data.bank_name;
                if (data.account_number) settings.account_number = data.account_number;
            }
            
            if (data.method_type === 'Wallet' && data.wallet_type) {
                settings.wallet_type = data.wallet_type;
            }
            
            if (data.method_type === 'Crypto' && data.crypto_type) {
                settings.crypto_type = data.crypto_type;
            }

            if (editingMethod) {
                const updatePayload: UpdatePaymentMethodRequest = {
                    method_type: data.method_type,
                    name: data.name,
                    is_active: data.is_active,
                    settings: Object.keys(settings).length > 0 ? settings : undefined,
                };
                await paymentMethodService.update(editingMethod.id, updatePayload);
            } else {
                const createPayload: CreatePaymentMethodRequest = {
                    method_type: data.method_type,
                    name: data.name,
                    is_active: data.is_active,
                    settings: Object.keys(settings).length > 0 ? settings : undefined,
                };
                await paymentMethodService.create(createPayload);
            }
            setDialogOpen(false);
            fetchMethods();
        } catch (error) {
            console.error("Failed to save payment method", error);
        }
    };

    const onDelete = async () => {
        if (!methodToDelete) return;
        try {
            setDeleting(true);
            await paymentMethodService.delete(methodToDelete.id);
            const newTotalPages = Math.ceil((methods.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            setDeleteDialogOpen(false);
            setMethodToDelete(null);
            fetchMethods();
        } catch (error: any) {
            console.error("Failed to delete payment method", error);
            alert(error.response?.data?.message || "Failed to delete payment method");
        } finally {
            setDeleting(false);
        }
    };

    // Get fee percentage from settings for display
    const getFeePercentage = (method: PaymentMethod) => {
        return method.settings?.fee_percentage || 0;
    };

    // Calculate pagination
    const totalPages = Math.ceil(methods.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMethods = methods.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Payment Methods</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure how you accept payments from customers.
                        </p>
                    </div>
                </div>
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Payment Methods</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure how you accept payments from customers.
                    </p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Method
                </Button>
            </div>

            {methods.length > 0 ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                        {paginatedMethods.map((method) => {
                        const Icon = methodTypeIcons[method.method_type] || CreditCard;
                        const fee = getFeePercentage(method);
                        return (
                            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">{method.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground">{method.method_type}</p>
                                            {fee > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{fee}% fee
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={method.is_active ? "outline" : "secondary"} className={method.is_active ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                        {method.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEdit(method)}>
                                                <Settings className="mr-2 h-4 w-4" /> Configure
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600"
                                                onClick={() => handleDelete(method)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={methods.length}
                        />
                    )}
                </>
            ) : (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No payment methods</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first payment method to start accepting payments from customers.
                        </p>
                        <Button variant="link" size="sm" className="mt-2 text-primary" onClick={handleAdd}>
                            Add Payment Method
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit/Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingMethod 
                                ? "Update the payment method details." 
                                : "Add a new payment method to accept payments from customers."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="method_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Method Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Credit Card">Credit Card</SelectItem>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="Wallet">Wallet</SelectItem>
                                                <SelectItem value="Crypto">Crypto</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Cash (USD), POS Terminal #1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="fee_percentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transaction Fee (%)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    value={field.value || ""}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Percentage fee added to payments using this method (e.g., 2.5 for 2.5%)
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
                                            <div className="text-sm text-muted-foreground">
                                                Enable this payment method for use
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

                            {/* Advanced Settings Collapsible */}
                            <Collapsible open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full justify-between">
                                        <span>Advanced Settings</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${advancedSettingsOpen ? 'transform rotate-180' : ''}`} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4 pt-4">
                                    {/* Method-specific fields */}
                                    {methodType === 'Cash' && (
                                        <FormField
                                            control={form.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Currency</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., USD, MVR, EUR" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Currency code for cash payments
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {methodType === 'Credit Card' && (
                                        <FormField
                                            control={form.control}
                                            name="terminal_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Terminal ID</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., POS-001" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Terminal or device identifier
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {methodType === 'Bank Transfer' && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="bank_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bank Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., Bank of Maldives" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="account_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Account Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., ****1234" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Account number (can be partially masked)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}

                                    {methodType === 'Wallet' && (
                                        <FormField
                                            control={form.control}
                                            name="wallet_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Wallet Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select wallet type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Mobile">Mobile</SelectItem>
                                                            <SelectItem value="Digital">Digital</SelectItem>
                                                            <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {methodType === 'Crypto' && (
                                        <FormField
                                            control={form.control}
                                            name="crypto_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Crypto Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select cryptocurrency" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                                            <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                                            <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder="Additional notes or instructions..."
                                                        className="resize-none"
                                                        rows={3}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional description or notes about this payment method
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CollapsibleContent>
                            </Collapsible>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingMethod ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the payment method "{methodToDelete?.name}". 
                            This action cannot be undone. If this payment method has been used in payments, 
                            it cannot be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
