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
