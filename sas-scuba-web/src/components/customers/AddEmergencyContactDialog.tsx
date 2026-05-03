"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EmergencyContactForm } from "@/components/customers/EmergencyContactForm";
import { AlertCircle } from "lucide-react";
import { Customer } from "@/lib/api/services/customer.service";

interface AddEmergencyContactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export function AddEmergencyContactDialog({ open, onOpenChange, customer }: AddEmergencyContactDialogProps) {
    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Add Emergency Contact
                    </DialogTitle>
                    <DialogDescription>
                        Register a new emergency contact for {customer.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <EmergencyContactForm
                    customerId={customer.id}
                    hideHeader={true}
                    onSave={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
