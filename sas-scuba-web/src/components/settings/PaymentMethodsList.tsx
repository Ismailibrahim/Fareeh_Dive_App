"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, CreditCard, Banknote, Wallet, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentMethod {
    id: number;
    name: string;
    description: string;
    type: "Cash" | "Card" | "Bank Transfer" | "Online";
    status: "Active" | "Inactive";
    icon: any;
}

const initialMethods: PaymentMethod[] = [
    { id: 1, name: "Cash (USD)", description: "Petty cash box at reception", type: "Cash", status: "Active", icon: Banknote },
    { id: 2, name: "POS Terminal #1", description: "Visa/Mastercard Terminal", type: "Card", status: "Active", icon: CreditCard },
    { id: 3, name: "BML Transfer", description: "Bank of Maldives Account", type: "Bank Transfer", status: "Active", icon: Wallet },
];

export function PaymentMethodsList() {
    const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Payment Methods</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure how you accept payments from customers.
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Method
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                {methods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                <method.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">{method.name}</h4>
                                <p className="text-xs text-muted-foreground">{method.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={method.status === "Active" ? "outline" : "secondary"} className={method.status === "Active" ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                {method.status}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" /> Configure
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium">No other payment methods</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Connect more payment gateways like Stripe or PayPal to accept online payments.
                    </p>
                    <Button variant="link" size="sm" className="mt-2 text-primary">Browse Integrations</Button>
                </div>
            </div>
        </div>
    );
}
