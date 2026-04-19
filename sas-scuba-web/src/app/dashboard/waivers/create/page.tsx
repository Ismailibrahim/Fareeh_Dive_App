import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { WaiverForm } from "@/components/waivers/WaiverForm";
import { PageLoader } from "@/components/ui/page-loader";

export default function CreateWaiverPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Create Waiver" />
            <div className="p-8">
                <Suspense fallback={<PageLoader />}>
                    <div className="max-w-4xl mx-auto">
                        <WaiverForm />
                    </div>
                </Suspense>
            </div>
        </div>
    );
}
