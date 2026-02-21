"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
    const name = formData.get("name") as string;
    const itemCode = formData.get("itemCode") as string;
    const category = formData.get("category") as string;
    const hsCode = formData.get("hsCode") as string;
    const measureUnit = formData.get("measureUnit") as string || "L";
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const packagePrice = parseFloat(formData.get("packagePrice") as string) || 0;
    // For liter products, also compute pricePerLiter for backwards compatibility
    const pricePerLiter = measureUnit === "L" ? (amount > 0 ? packagePrice / amount : 0) : packagePrice;
    const description = formData.get("description") as string;

    await prisma.product.create({
        data: {
            name,
            itemCode,
            category,
            hsCode,
            measureUnit,
            amount,
            packagePrice,
            pricePerLiter,
            description,
        },
    });

    revalidatePath("/inventory");
    revalidatePath("/offers/new");
}

export async function updateProduct(id: number, formData: FormData) {
    const name = formData.get("name") as string;
    const itemCode = formData.get("itemCode") as string;
    const category = formData.get("category") as string;
    const hsCode = formData.get("hsCode") as string;
    const measureUnit = formData.get("measureUnit") as string || "L";
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const packagePrice = parseFloat(formData.get("packagePrice") as string) || 0;
    const pricePerLiter = measureUnit === "L" ? (amount > 0 ? packagePrice / amount : 0) : packagePrice;
    const description = formData.get("description") as string;

    await prisma.product.update({
        where: { id },
        data: {
            name,
            itemCode,
            category,
            hsCode,
            measureUnit,
            amount,
            packagePrice,
            pricePerLiter,
            description,
        },
    });

    revalidatePath("/inventory");
    revalidatePath("/offers/new");
}

export async function deleteProduct(id: number) {
    await prisma.product.delete({
        where: { id }
    });
    revalidatePath("/inventory");
    revalidatePath("/offers/new");
}

export async function saveInvoice(data: any) {
    // 1. Find the last invoice to get the highest numeric part
    // We use offerCount as the reliable numeric sequence
    const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { offerCount: 'desc' },
    });

    const nextCount = lastInvoice ? lastInvoice.offerCount + 1 : 1;
    const formattedOfferNumber = `OFF-${nextCount.toString().padStart(4, '0')}`;

    // 2. Create the record
    await prisma.invoice.create({
        data: {
            offerNumber: formattedOfferNumber,
            offerCount: nextCount,
            clientName: data.billingName || "Unknown Client",
            date: data.date ? new Date(data.date) : new Date(),
            totalNet: data.net || 0,
            vat: data.vat || 0,
            lineItems: {
                create: (data.lineItems || []).map((item: any) => ({
                    quantity: Number(item.quantity) || 0,
                    unit: item.measureUnit || "L",
                    priceAtTimeOfSale: Number(item.packagePrice) || 0,
                    productId: item.productId ? Number(item.productId) : null,
                }))
            }
        },
    });

    revalidatePath("/offers");
    const nextOfferNumber = `OFF-${(nextCount + 1).toString().padStart(4, '0')}`;
    return { success: true, nextOfferNumber };
}
