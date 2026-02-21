import { OfferCreator } from "@/components/OfferCreator";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function NewOfferPage() {
    const products = await prisma.product.findMany();

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Receipts</h1>
            <div className="flex-1 min-h-0">
                <OfferCreator products={products} />
            </div>
        </div>
    );
}
