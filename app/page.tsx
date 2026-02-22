import { AnalyticsCard } from "@/components/AnalyticsCard";
import { FileText, Package, TrendingUp, Users } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function Home() {
    const productCount = await prisma.product.count();
    const invoiceCount = await prisma.invoice.count();

    // Get total revenue (sum of all invoice totals)
    const invoices = await prisma.invoice.findMany({
        select: { totalNet: true, vat: true }
    });
    const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalNet + inv.vat), 0);

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">System Overview</h2>
                <p className="text-muted-foreground">Real-time statistics from your receipt system.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsCard
                    title="Total Receipts"
                    value={invoiceCount.toString()}
                    description="Total generated receipts"
                    icon={FileText}
                />
                <AnalyticsCard
                    title="Product Catalog"
                    value={productCount.toString()}
                    description="Items in inventory"
                    icon={Package}
                />
                <AnalyticsCard
                    title="Total Revenue"
                    value={`€${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    description="Total net + tax"
                    icon={TrendingUp}
                />
                <AnalyticsCard
                    title="System Status"
                    value="Active"
                    description="Database synchronized"
                    icon={Users}
                />
            </div>
        </div>
    );
}
