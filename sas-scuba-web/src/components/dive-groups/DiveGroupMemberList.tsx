"use client";

import { Customer } from "@/lib/api/services/customer.service";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface DiveGroupMemberListProps {
    members: Customer[];
    onRemoveMember: (customerId: number) => void;
}

export function DiveGroupMemberList({ members, onRemoveMember }: DiveGroupMemberListProps) {
    if (members.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No members in this group. Add members to get started.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.map((member) => (
                    <TableRow key={member.id}>
                        <TableCell className="font-medium">
                            <Link
                                href={`/dashboard/customers/${member.id}`}
                                className="text-primary hover:underline"
                            >
                                {member.full_name}
                            </Link>
                        </TableCell>
                        <TableCell>{member.email || '-'}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>{member.nationality || '-'}</TableCell>
                        <TableCell className="text-right">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveMember(member.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

