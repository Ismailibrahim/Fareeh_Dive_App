import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { WaiversList } from "@/components/waivers/WaiversList";
import { PageLoader } from "@/components/ui/page-loader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function WaiversPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header
                title="Waivers"
                actions={
                    <Link href="/dashboard/waivers/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Waiver
                        </Button>
                    </Link>
                }
            />
            <div className="p-8">
                <Suspense fallback={<PageLoader />}>
                    <WaiversList />
                </Suspense>
            </div>
        </div>
    );
}
