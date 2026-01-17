"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { diveGroupService } from "@/lib/api/services/dive-group.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: number;
    onSuccess?: () => void;
}

export function AddMemberDialog({
    open,
    onOpenChange,
    groupId,
    onSuccess,
}: AddMemberDialogProps) {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (open) {
            fetchCustomers();
        }
    }, [open]);

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const response = await customerService.getAll({ search: searchTerm });
            const customerList = Array.isArray(response) ? response : (response as any).data || [];
            setCustomers(customerList);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    useEffect(() => {
        if (open && searchTerm) {
            const timeoutId = setTimeout(() => {
                fetchCustomers();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchTerm, open]);

    const handleAdd = async () => {
        if (!selectedCustomerId) return;

        setLoading(true);
        try {
            await diveGroupService.addMember(groupId, parseInt(selectedCustomerId));
            if (onSuccess) {
                onSuccess();
            }
            onOpenChange(false);
            setSelectedCustomerId("");
        } catch (error: any) {
            console.error("Failed to add member", error);
            const errorMessage = error?.response?.data?.message || "Failed to add member to group";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Member to Group</DialogTitle>
                    <DialogDescription>
                        Select a customer to add to this dive group.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="search">Search Customers</Label>
                        <Input
                            id="search"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer">Customer *</Label>
                        {loadingCustomers ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : (
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.length === 0 ? (
                                        <SelectItem value="none" disabled>No customers found</SelectItem>
                                    ) : (
                                        customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.full_name} {customer.email ? `(${customer.email})` : ''}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={loading || !selectedCustomerId}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "Add Member"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

