"use client";

import { Header } from "@/components/layout/Header";
import { PriceListForm } from "@/components/price-list/PriceListForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, List } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreatePriceListPage() {
    const router = useRouter();

    const handleSuccess = async (createdPriceList?: { id: number }) => {
        // Redirect to the edit page of the newly created price list
        if (createdPriceList?.id) {
            router.push(`/dashboard/price-list/${createdPriceList.id}/edit`);
        } else {
            // Fallback: redirect to list page if ID is not available
            router.push('/dashboard/price-list');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Create Price List" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/price-list">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create Price List</h2>
                        <p className="text-muted-foreground">Create a new price list for your dive center.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <List className="h-5 w-5 text-primary" />
                                Price List Information
                            </CardTitle>
                            <CardDescription>
                                Enter the details for your new price list.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PriceListForm onSuccess={handleSuccess} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

