import { Skeleton } from "@/components/ui/skeleton";
import {
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";

interface TableLoadingProps {
    columns: number;
    rows?: number;
}

export function TableLoading({ columns, rows = 5 }: TableLoadingProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: columns }).map((_, j) => (
                        <TableCell key={j}>
                            {j === 0 ? (
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ) : j === columns - 1 ? (
                                <Skeleton className="h-8 w-8 ml-auto" />
                            ) : (
                                <Skeleton className="h-4 w-24" />
                            )}
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
