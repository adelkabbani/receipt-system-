import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";

const CatalogViewer = dynamic(() => import('@/components/CatalogViewer').then(mod => mod.CatalogViewer), {
    ssr: false,
    loading: () => <div className="h-[600px] flex items-center justify-center bg-muted/20 text-muted-foreground rounded-md">Loading Catalog Viewer...</div>
});

export default async function OffersPage() {
    const products = await prisma.product.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return (
        <div className="h-full p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Offers Catalog</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Full product price list — {products.length} products ready to print
                    </p>
                </div>
            </div>
            <CatalogViewer products={products} />
        </div>
    );
}
