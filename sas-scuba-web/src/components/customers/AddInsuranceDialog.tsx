"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CustomerInsuranceForm } from "@/components/customer-insurances/CustomerInsuranceForm";
import { Shield } from "lucide-react";
import { Customer } from "@/lib/api/services/customer.service";

interface AddInsuranceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export function AddInsuranceDialog({ open, onOpenChange, customer }: AddInsuranceDialogProps) {
    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Add Insurance
                    </DialogTitle>
                    <DialogDescription>
                        Register insurance details for {customer.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <CustomerInsuranceForm
                    initialData={{ customer_id: customer.id }}
                    disableCustomerSelect={true}
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
