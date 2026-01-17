"use client";

import { PackageBreakdown as PackageBreakdownType } from "@/lib/api/services/package.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PackageBreakdownProps {
    breakdown: PackageBreakdownType;
}

export function PackageBreakdown({ breakdown }: PackageBreakdownProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Package Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Type</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">QTY</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {breakdown.breakdown.map((item, index) => {
                            const isHeader = item.type === 'Breakdown';
                            const isTotal = item.type === 'Total';
                            const isItemName = item.type === 'Item Name';

                            return (
                                <TableRow
                                    key={index}
                                    className={isHeader ? 'bg-muted/50' : isTotal ? 'font-bold border-t-2' : ''}
                                >
                                    <TableCell className={isHeader ? 'font-semibold' : ''}>
                                        {item.type}
                                    </TableCell>
                                    <TableCell className={isHeader ? 'font-semibold' : ''}>
                                        {item.name}
                                    </TableCell>
                                    <TableCell className={isHeader ? 'font-semibold' : ''}>
                                        {item.description}
                                    </TableCell>
                                    <TableCell className={`text-right ${isHeader ? 'font-semibold' : ''}`}>
                                        {item.unit_price !== null ? `$${item.unit_price.toFixed(2)}` : ''}
                                    </TableCell>
                                    <TableCell className={`text-right ${isHeader ? 'font-semibold' : ''}`}>
                                        {item.quantity !== null ? item.quantity : ''}
                                    </TableCell>
                                    <TableCell className={isHeader ? 'font-semibold' : ''}>
                                        {item.unit}
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${isTotal ? 'text-lg' : ''}`}>
                                        {item.total !== null ? `$${item.total.toFixed(2)}` : ''}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

