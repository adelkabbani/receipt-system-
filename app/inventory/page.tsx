import { InventoryTable } from "@/components/InventoryTable";
import prisma from "@/lib/prisma";

export default async function InventoryPage() {
    const products = await prisma.product.findMany({
        orderBy: { id: "desc" }
    });

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
            <InventoryTable products={products} />
        </div>
    );
}
