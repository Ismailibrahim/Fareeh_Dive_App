"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CustomerCertificationForm } from "@/components/customer-certifications/CustomerCertificationForm";
import { Award } from "lucide-react";
import { Customer } from "@/lib/api/services/customer.service";

interface AddCertificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export function AddCertificationDialog({ open, onOpenChange, customer }: AddCertificationDialogProps) {
    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Add Certification
                    </DialogTitle>
                    <DialogDescription>
                        Register a new certification for {customer.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <CustomerCertificationForm
                    initialData={{ customer_id: customer.id }}
                    disableCustomerSelect={true}
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
