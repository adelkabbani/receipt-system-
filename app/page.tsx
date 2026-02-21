import { AnalyticsCard } from "@/components/AnalyticsCard";
import { FileText, Package } from "lucide-react";

export default function Home() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsCard
                    title="Total Offers (Today)"
                    value="12"
                    description="+20.1% from yesterday"
                    icon={FileText}
                />
                <AnalyticsCard
                    title="Top Selling Product"
                    value="Engine Oil 5W-30"
                    description="340 Units sold"
                    icon={Package}
                />
            </div>
        </div>
    );
}
