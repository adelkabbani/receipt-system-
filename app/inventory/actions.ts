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
    // 1. Read the current sequence from Settings (authoritative, survives restarts)
    let settings = await prisma.settings.findFirst({ where: { id: 1 } });
    if (!settings) settings = await initSettings();

    const currentNumber = settings.nextReceiptNumber;
    const formattedOfferNumber = `OFF-${currentNumber.toString().padStart(4, '0')}`;

    // 2. Save the invoice with the current sequence number
    await prisma.invoice.create({
        data: {
            offerNumber: formattedOfferNumber,
            offerCount: currentNumber,
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

    // 3. Atomically increment the sequence in Settings for the next receipt
    const nextNumber = currentNumber + 1;
    await prisma.settings.update({
        where: { id: 1 },
        data: { nextReceiptNumber: nextNumber },
    });

    revalidatePath("/offers");
    revalidatePath("/settings");

    // Return the NEXT number so the UI can display it immediately
    const nextOfferNumber = `OFF-${nextNumber.toString().padStart(4, '0')}`;
    return { success: true, nextOfferNumber };
}

export async function getSettings() {
    let settings = await prisma.settings.findFirst({
        where: { id: 1 }
    });

    if (!settings) {
        settings = await initSettings();
    }

    return settings;
}

export async function initSettings() {
    return await prisma.settings.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            companyName: "Shikh Al Ard General Trading",
            defaultVatRate: 19,
            defaultProfitMargin: 0,
            logoPath: "/kinan logo .png",
            nextReceiptNumber: 1,
        }
    });
}

export async function updateSettings(data: any) {
    const updateData: any = {
        companyName: data.companyName,
        defaultVatRate: parseFloat(data.defaultVatRate),
        defaultProfitMargin: parseFloat(data.defaultProfitMargin),
        logoPath: data.logoPath,
    };

    // Only update nextReceiptNumber if explicitly provided (allows manual sequence override)
    if (data.nextReceiptNumber !== undefined && data.nextReceiptNumber !== '' && !isNaN(parseInt(data.nextReceiptNumber))) {
        updateData.nextReceiptNumber = parseInt(data.nextReceiptNumber);
    }

    const settings = await prisma.settings.update({
        where: { id: 1 },
        data: updateData,
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/offers/new");
    return { success: true, settings };
}
