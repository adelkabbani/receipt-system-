"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addProduct, updateProduct, deleteProduct } from "@/app/inventory/actions";
import { useRouter } from "next/navigation";

// Matches the Prisma schema
type Product = {
    id: number;
    itemCode: string | null;
    category: string | null;
    name: string;
    hsCode: string | null;
    amount: number | null;       // The package size (e.g. 180 for 180Kg, 208 for 208L)
    measureUnit: string | null;  // "L", "kg", "g"
    packagePrice: number;        // Total price for this package (e.g. 494.11 for 180Kg)
    pricePerLiter: number;       // Price per liter (only for L products, auto-calculated)
    description: string | null;
};

const CATEGORIES = [
    "PKW-Motorenöle",
    "Truck Oils",
    "Mono Grade Oils",
    "GEAR + ATF-Oils",
    "Greas",
    "Brake fluids",
    "Antifreez",
    "Others"
];

const MEASURE_UNITS = [
    { label: "Liters (L)", value: "L" },
    { label: "Kilograms (kg)", value: "kg" },
    { label: "Grams (g)", value: "g" },
];

export function InventoryTable({ products }: { products: Product[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const router = useRouter();

    async function handleAdd(formData: FormData) {
        await addProduct(formData);
        setIsOpen(false);
        router.refresh();
    }

    async function handleUpdate(formData: FormData) {
        if (!editProduct) return;
        await updateProduct(editProduct.id, formData);
        setEditProduct(null);
        router.refresh();
    }

    async function handleDelete(id: number) {
        if (confirm("Are you sure?")) {
            await deleteProduct(id);
            router.refresh();
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Products List</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <form action={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select name="category" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="itemCode">Item Code</Label>
                                    <Input id="itemCode" name="itemCode" placeholder="e.g. 2050180" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div>
                                    <Label htmlFor="hsCode">HS Code</Label>
                                    <Input id="hsCode" name="hsCode" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="measureUnit">Unit</Label>
                                    <Select name="measureUnit" defaultValue="L" required>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MEASURE_UNITS.map(u => (
                                                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="amount">Package Size</Label>
                                    <Input id="amount" name="amount" type="number" step="0.001" placeholder="e.g. 180" required />
                                </div>
                                <div>
                                    <Label htmlFor="packagePrice">Total Package Price (€)</Label>
                                    <Input id="packagePrice" name="packagePrice" type="number" step="0.01" placeholder="e.g. 494.11" required />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea id="description" name="description" className="min-h-[100px]" placeholder="Enter product description..." />
                            </div>
                            <Button type="submit" className="w-full">Save Product</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-category">Category</Label>
                                <Select name="category" defaultValue={editProduct?.category || ""}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-itemCode">Item Code</Label>
                                <Input id="edit-itemCode" name="itemCode" defaultValue={editProduct?.itemCode || ""} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" name="name" defaultValue={editProduct?.name} required />
                            </div>
                            <div>
                                <Label htmlFor="edit-hsCode">HS Code</Label>
                                <Input id="edit-hsCode" name="hsCode" defaultValue={editProduct?.hsCode || ""} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="edit-measureUnit">Unit</Label>
                                <Select name="measureUnit" defaultValue={editProduct?.measureUnit || "L"} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEASURE_UNITS.map(u => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-amount">Package Size</Label>
                                <Input id="edit-amount" name="amount" type="number" step="0.001" defaultValue={editProduct?.amount || 0} required />
                            </div>
                            <div>
                                <Label htmlFor="edit-packagePrice">Total Package Price (€)</Label>
                                <Input id="edit-packagePrice" name="packagePrice" type="number" step="0.01" defaultValue={editProduct?.packagePrice || 0} required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea id="edit-description" name="description" defaultValue={editProduct?.description || ""} className="min-h-[100px]" />
                        </div>
                        <Button type="submit" className="w-full">Update Product</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>HS Code</TableHead>
                            <TableHead className="text-right">Package</TableHead>
                            <TableHead className="text-right">Package Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No products found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="text-xs font-semibold text-muted-foreground uppercase">{product.category || "-"}</TableCell>
                                    <TableCell className="font-medium">{product.itemCode || "-"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{product.name}</TableCell>
                                    <TableCell>{product.hsCode || "-"}</TableCell>
                                    <TableCell className="text-right">{product.amount || 0}{product.measureUnit || "L"}</TableCell>
                                    <TableCell className="text-right">€{product.packagePrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => setEditProduct(product)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
