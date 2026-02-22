"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, PackageX } from "lucide-react";
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
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const q = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.itemCode && p.itemCode.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        );
    }, [products, searchQuery]);

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent uppercase tracking-wider">Products Inventory</h2>
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{products.length} Items total</p>
                </div>

                <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search code or name..."
                            className="pl-9 bg-gold-500/5 border-gold-500/20 focus:border-gold-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gold-500 hover:bg-gold-600 text-black font-bold h-10 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-slate-950 border-gold-500/20">
                            <DialogHeader>
                                <DialogTitle className="text-gold-500">Add New Product</DialogTitle>
                            </DialogHeader>
                            <form action={handleAdd} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select name="category" required>
                                            <SelectTrigger className="bg-slate-900/50">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-gold-500/20">
                                                {CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="itemCode">Item Code</Label>
                                        <Input id="itemCode" name="itemCode" placeholder="e.g. 2050180" className="bg-slate-900/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" name="name" required className="bg-slate-900/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hsCode">HS Code</Label>
                                        <Input id="hsCode" name="hsCode" className="bg-slate-900/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="measureUnit">Unit</Label>
                                        <Select name="measureUnit" defaultValue="L" required>
                                            <SelectTrigger className="bg-slate-900/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-gold-500/20">
                                                {MEASURE_UNITS.map(u => (
                                                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Package Size</Label>
                                        <Input id="amount" name="amount" type="number" step="0.001" placeholder="e.g. 180" required className="bg-slate-900/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="packagePrice">Total Package Price (€)</Label>
                                        <Input id="packagePrice" name="packagePrice" type="number" step="0.01" placeholder="e.g. 494.11" required className="bg-slate-900/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea id="description" name="description" className="min-h-[100px] bg-slate-900/50" placeholder="Enter product description..." />
                                </div>
                                <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold">Save Product</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
                <DialogContent className="max-w-2xl bg-slate-950 border-gold-500/20">
                    <DialogHeader>
                        <DialogTitle className="text-gold-500">Edit Product</DialogTitle>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select name="category" defaultValue={editProduct?.category || ""}>
                                    <SelectTrigger className="bg-slate-900/50">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-gold-500/20">
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-itemCode">Item Code</Label>
                                <Input id="edit-itemCode" name="itemCode" defaultValue={editProduct?.itemCode || ""} className="bg-slate-900/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" name="name" defaultValue={editProduct?.name} required className="bg-slate-900/50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-hsCode">HS Code</Label>
                                <Input id="edit-hsCode" name="hsCode" defaultValue={editProduct?.hsCode || ""} className="bg-slate-900/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-measureUnit">Unit</Label>
                                <Select name="measureUnit" defaultValue={editProduct?.measureUnit || "L"} required>
                                    <SelectTrigger className="bg-slate-900/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-gold-500/20">
                                        {MEASURE_UNITS.map(u => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">Package Size</Label>
                                <Input id="edit-amount" name="amount" type="number" step="0.001" defaultValue={editProduct?.amount || 0} required className="bg-slate-900/50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-packagePrice">Total Package Price (€)</Label>
                                <Input id="edit-packagePrice" name="packagePrice" type="number" step="0.01" defaultValue={editProduct?.packagePrice || 0} required className="bg-slate-900/50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea id="edit-description" name="description" defaultValue={editProduct?.description || ""} className="min-h-[100px] bg-slate-900/50" />
                        </div>
                        <Button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold">Update Product</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="gold-glass rounded-2xl shadow-sm border border-gold-500/10 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="border-gold-500/10 hover:bg-transparent">
                            <TableHead className="text-xs font-bold uppercase tracking-widest text-gold-500/80">Category</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-widest text-gold-500/80">Item</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-widest text-gold-500/80">Name</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-widest text-gold-500/80">HS Code</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-gold-500/80">Package</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-gold-500/80">Package Price</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-gold-500/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <PackageX className="h-10 w-10 text-gold-500/30" />
                                        <div>
                                            <p className="font-bold text-foreground">No items found</p>
                                            <p className="text-xs uppercase tracking-widest">Adjust your search or add a new product</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id} className="border-gold-500/5 hover:bg-gold-500/5 transition-colors group">
                                    <TableCell className="text-[10px] font-black text-muted-foreground uppercase">{product.category || "-"}</TableCell>
                                    <TableCell className="font-mono text-xs">{product.itemCode || "-"}</TableCell>
                                    <TableCell className="font-bold text-foreground max-w-[200px] truncate">{product.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{product.hsCode || "-"}</TableCell>
                                    <TableCell className="text-right font-medium">{product.amount || 0}{product.measureUnit || "L"}</TableCell>
                                    <TableCell className="text-right font-black text-gold-500">€{product.packagePrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold-500 hover:bg-gold-500/20" onClick={() => setEditProduct(product)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={() => handleDelete(product.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
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
