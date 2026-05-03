"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FileCheck, ShieldAlert, HeartPulse, ChevronDown } from "lucide-react";
import { fillPDF, CustomerData } from "@/lib/utils/pdf-filler";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CustomerPDFFillSectionProps {
    customer: CustomerData;
}

export function CustomerPDFFillSection({ customer }: CustomerPDFFillSectionProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const pdfs = [
        {
            name: "Diver Medical Form",
            filename: "10346 Diver Medical Form.pdf",
            icon: HeartPulse,
            description: "Physical health and medical history statement",
            color: "text-red-500 bg-red-50"
        },
        {
            name: "Release of Liability",
            filename: "10072 Release of Liability_Assumption of Risk_Non-agency Acknowledgment Form – General Training.pdf",
            icon: ShieldAlert,
            description: "Liability release and assumption of risk agreement",
            color: "text-orange-500 bg-orange-50"
        },
        {
            name: "Safe Diving Practices",
            filename: "10060 Standard Safe Diving Practices Statement of Understanding.pdf",
            icon: FileCheck,
            description: "Acknowledgment of safe diving practices and standards",
            color: "text-blue-500 bg-blue-50"
        }
    ];

    const handleFill = async (filename: string) => {
        setLoading(filename);
        try {
            await fillPDF(`/${filename}`, customer);
        } finally {
            setLoading(null);
        }
    };

    return (
        <Card className="overflow-hidden border-primary/20 shadow-sm">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Legal & Medical Documents</CardTitle>
                                    <CardDescription>
                                        Generate and download pre-filled PDF forms
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex -space-x-2 mr-4">
                                    {pdfs.map((pdf, i) => (
                                        <div key={i} className={cn("h-8 w-8 rounded-full border-2 border-background flex items-center justify-center", pdf.color)}>
                                            <pdf.icon className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            {pdfs.map((pdf) => (
                                <div 
                                    key={pdf.filename} 
                                    className="group flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="space-y-3">
                                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", pdf.color)}>
                                            <pdf.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm line-clamp-1">{pdf.name}</h4>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {pdf.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleFill(pdf.filename)}
                                        disabled={loading !== null}
                                        className="mt-6 w-full gap-2"
                                        variant="outline"
                                        size="sm"
                                    >
                                        {loading === pdf.filename ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        Generate Filled PDF
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-dashed flex items-start gap-3">
                            <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                These documents will be automatically filled with the customer's personal information (Name, DOB, etc.) from their profile. 
                                Some fields may still require manual input or physical signatures after printing.
                            </p>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
