"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CustomerAccommodationForm } from "@/components/customers/CustomerAccommodationForm";
import { Building2 } from "lucide-react";
import { Customer } from "@/lib/api/services/customer.service";

interface AddAccommodationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export function AddAccommodationDialog({ open, onOpenChange, customer }: AddAccommodationDialogProps) {
    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Add Accommodation
                    </DialogTitle>
                    <DialogDescription>
                        Register accommodation details for {customer.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <CustomerAccommodationForm
                    customerId={customer.id}
                    hideHeader={true}
                    onSave={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
