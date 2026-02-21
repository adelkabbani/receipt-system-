"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, FileText, Settings, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { saveInvoice } from "@/app/inventory/actions";

// Dynamic import to avoid SSR issues with react-pdf binding
const PDFPreview = dynamic(() => import("./PDFPreview"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted/20 text-muted-foreground">Initializing PDF Preview...</div>
});

export function OfferCreator({ products }: { products: any[] }) {
    const [formData, setFormData] = useState({
        offerNumber: "OFF-0001",
        billingName: "",    // New 'Bill To' name
        clientLocation: "",
        clientNumber: "",
        date: new Date(),
        syriaExport: false,
        location: 'cairo' as 'cairo' | 'damascus', // New location state
        branch: 'moller' as 'moller' | 'gpc',      // New branch state
        vatRate: 19,                               // New VAT rate state (default 19)
        profitMargin: 0,                           // New Profit Margin state (default 0%)
        lineItems: [] as any[]
    });

    const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

    const [totals, setTotals] = useState({ net: 0, vat: 0, gross: 0 });

    // Recalculate totals whenever lineItems change
    useEffect(() => {
        const net = formData.lineItems.reduce((acc, item) => {
            // packagePrice is the total price for one package (authoritative for all product types).
            // For L products: packagePrice = pricePerLiter × amount (set on product creation/restore).
            // For kg/g products: packagePrice = total drum/bag price.
            // Fallback: if packagePrice is 0 (very old data), compute from amount × pricePerLiter.
            const pkgPrice = Number(item.packagePrice) || (Number(item.amount || 0) * Number(item.pricePerLiter || 0));
            const itemTotal = Number(item.quantity) * pkgPrice;
            return acc + itemTotal;
        }, 0);

        // Syria Export: 0% VAT, otherwise dynamic vatRate
        const vat = formData.syriaExport ? 0 : net * (formData.vatRate / 100);
        const gross = net + vat;
        setTotals({ net, vat, gross });
    }, [formData.lineItems, formData.syriaExport, formData.vatRate]);

    // Recalculate prices when profit margin changes
    useEffect(() => {
        setFormData(prev => {
            const marginMultiplier = 1 + (Number(formData.profitMargin) / 100);
            const updatedItems = prev.lineItems.map(item => ({
                ...item,
                // For weight products, apply margin to packagePrice
                // For liter products, apply margin to pricePerLiter
                packagePrice: item.basePackagePrice ? Number(item.basePackagePrice) * marginMultiplier : item.packagePrice,
                pricePerLiter: item.basePrice ? Number(item.basePrice) * marginMultiplier : item.pricePerLiter
            }));
            return { ...prev, lineItems: updatedItems };
        });
    }, [formData.profitMargin]);

    const addLineItem = () => {
        setFormData(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, {
                productId: "",
                productName: "",
                itemCode: "",
                category: "",
                name: "",
                description: "",
                quantity: 1,
                amount: 0,        // Package size (e.g. 180 for 180Kg)
                measureUnit: "L", // Default unit
                basePrice: 0,
                pricePerLiter: 0, // For L products
                basePackagePrice: 0,
                packagePrice: 0,  // For kg/g products (total package price)
            }]
        }));
    };

    const removeLineItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            lineItems: prev.lineItems.filter((_, i) => i !== index)
        }));
    };

    const updateLineItem = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newItems = [...prev.lineItems];
            newItems[index] = { ...newItems[index], [field]: value };

            // Auto-fill details if product selected
            if (field === "productId") {
                const product = products.find(p => p.id.toString() === value);
                if (product) {
                    newItems[index].itemCode = product.itemCode || "";
                    newItems[index].category = product.category || "";
                    newItems[index].name = product.name;
                    newItems[index].description = product.description || "";
                    newItems[index].productName = product.name;
                    newItems[index].amount = product.amount || 0;
                    newItems[index].measureUnit = product.measureUnit || "L";
                    // Store base prices for margin calculations
                    newItems[index].basePackagePrice = product.packagePrice;
                    newItems[index].packagePrice = product.packagePrice * (1 + formData.profitMargin / 100);
                    newItems[index].basePrice = product.pricePerLiter;
                    newItems[index].pricePerLiter = product.pricePerLiter * (1 + formData.profitMargin / 100);
                    newItems[index].hsCode = formData.syriaExport ? "27101981" : (product.hsCode || "");
                }
            }

            return { ...prev, lineItems: newItems };
        });
    };

    const toggleSyriaExport = (checked: boolean) => {
        setFormData(prev => {
            // Update HS codes for existing line items
            const newItems = prev.lineItems.map(item => ({
                ...item,
                hsCode: checked ? "27101981" : item.hsCode // You might want to revert to original HS code on uncheck, but for now we basically just toggle ON the forced code
            }));

            return {
                ...prev,
                syriaExport: checked,
                lineItems: newItems
            };
        });
    };

    const handleSave = async () => {
        try {
            const result = await saveInvoice({ ...formData, ...totals });
            if (result.success) {
                alert(`Receipt Saved Successfully! \nNext ID: ${result.nextOfferNumber}`);
                // Auto-increment the UI for the next receipt
                setFormData(prev => ({
                    ...prev,
                    offerNumber: result.nextOfferNumber,
                    lineItems: [], // Clear items for next use
                    billingName: "",
                    clientLocation: "",
                    clientNumber: ""
                }));
            }
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save receipt. Check console for details.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
            {/* Left: Form - Glassmorphism Style */}
            <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-4">

                {/* Offer Details Card */}
                <div className="space-y-4 rounded-xl p-6 gold-glass shadow-sm transition-all hover:shadow-[0_8px_40px_rgba(212,175,55,0.2)] border-gold-500/20">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
                            <FileText className="mr-2 h-5 w-5 text-gold-500" /> Receipt Details
                        </h3>
                    </div>

                    {/* Configuration Controls */}
                    <div className="flex flex-wrap gap-4 p-4 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                            <Label className="text-xs font-medium mr-2">Location:</Label>
                            <div className="flex bg-muted rounded-lg p-0.5">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, location: 'cairo' }))}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                        formData.location === 'cairo' ? "bg-gold-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Cairo
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, location: 'damascus' }))}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                        formData.location === 'damascus' ? "bg-gold-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Damascus
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                            <Label className="text-xs font-medium mr-2">Branch:</Label>
                            <div className="flex bg-muted rounded-lg p-0.5">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, branch: 'moller' }))}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                        formData.branch === 'moller' ? "bg-gold-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Moller
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, branch: 'gpc' }))}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                                        formData.branch === 'gpc' ? "bg-gold-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    GPC
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                            <Label className="text-xs font-medium mr-2 whitespace-nowrap">Profit %:</Label>
                            <Input
                                type="number"
                                value={formData.profitMargin}
                                onChange={(e) => setFormData({ ...formData, profitMargin: Number(e.target.value) })}
                                className="w-16 h-8 text-xs bg-white/50 dark:bg-black/20 p-1"
                            />
                        </div>
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Receipt Number</Label>
                            <Input
                                value={formData.offerNumber}
                                onChange={(e) => setFormData({ ...formData, offerNumber: e.target.value })}
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-white/50 dark:bg-black/20",
                                            !formData.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date}
                                        onSelect={(date) => date && setFormData({ ...formData, date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Bill To (Name)</Label>
                        <Input
                            value={formData.billingName}
                            onChange={(e) => setFormData({ ...formData, billingName: e.target.value })}
                            placeholder="Enter client/company name..."
                            className="bg-white/50 dark:bg-black/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                                value={formData.clientLocation}
                                onChange={(e) => setFormData({ ...formData, clientLocation: e.target.value })}
                                placeholder="Enter location..."
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Company Number</Label>
                            <Input
                                value={formData.clientNumber}
                                onChange={(e) => setFormData({ ...formData, clientNumber: e.target.value })}
                                placeholder="Enter company number..."
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Products Card */}
                <div className="space-y-4 rounded-xl p-6 gold-glass shadow-sm border-gold-500/20 flex flex-col max-h-[600px]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">Products</h3>
                    </div>

                    {/* Scrollable items list */}
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                        {formData.lineItems.map((item, index) => (
                            <div key={index} className="flex flex-col gap-3 p-4 border rounded-xl bg-white/10 dark:bg-black/40 hover:bg-gold-500/10 transition-colors border-gold-500/20 shadow-md">
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs font-semibold text-gold-500/70">Product Name</Label>
                                        <Popover open={openPopovers[index]} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [index]: open }))}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between bg-black/20 dark:bg-black/40 border-gold-500/30 hover:border-gold-500 hover:bg-gold-500/10 text-white transition-all",
                                                        !item.productName && "text-white/50"
                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {item.productName ? item.productName : "Select product..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gold-500" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search product..." />
                                                    <CommandList>
                                                        <CommandEmpty>No product found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {Array.from(new Set(products.map(p => p.name))).sort().map(name => (
                                                                <CommandItem
                                                                    key={name}
                                                                    value={name.toLowerCase()}
                                                                    onSelect={() => {
                                                                        setFormData(prev => {
                                                                            const newItems = [...prev.lineItems];
                                                                            newItems[index] = {
                                                                                ...newItems[index],
                                                                                productName: name,
                                                                                productId: "",
                                                                                itemCode: "",
                                                                                pricePerLiter: 0,
                                                                                packagePrice: 0,
                                                                                amount: 0
                                                                            };
                                                                            return { ...prev, lineItems: newItems };
                                                                        });
                                                                        setOpenPopovers(prev => ({ ...prev, [index]: false }));
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            item.productName === name ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs font-semibold text-gold-500/70">Variant (Size)</Label>
                                        <Select
                                            value={item.productId}
                                            disabled={!item.productName}
                                            onValueChange={(val) => updateLineItem(index, "productId", val)}
                                        >
                                            <SelectTrigger className="bg-black/20 dark:bg-black/40 border-gold-500/30 hover:border-gold-500 text-white transition-all">
                                                <SelectValue placeholder={item.productName ? "Select Size..." : "Choose Name First"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products
                                                    .filter(p => p.name === item.productName)
                                                    .sort((a, b) => (a.amount || 0) - (b.amount || 0))
                                                    .map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.amount}{p.measureUnit || "L"} — €{p.packagePrice?.toFixed(2)} — {p.itemCode}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="pt-6">
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeLineItem(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Qty</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                                            className="bg-transparent"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Package ({item.amount || 0}{item.measureUnit || "L"})</Label>
                                        <div className="h-10 flex items-center px-3 rounded-md bg-muted/20 text-sm text-muted-foreground">
                                            {item.amount || 0}{item.measureUnit || "L"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Pkg Price (€)</Label>
                                        <Input
                                            type="number"
                                            disabled
                                            value={Number(item.packagePrice || item.pricePerLiter || 0).toFixed(2)}
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-sky-600 dark:text-sky-400">Total</Label>
                                        <div className="h-10 flex items-center justify-end px-3 rounded-md bg-secondary/30 font-mono text-sm font-semibold">
                                            {(() => {
                                                const isWeight = item.measureUnit === "kg" || item.measureUnit === "g";
                                                const total = isWeight
                                                    ? Number(item.quantity) * Number(item.packagePrice)
                                                    : Number(item.quantity) * Number(item.amount) * Number(item.pricePerLiter);
                                                return `€${total.toFixed(2)}`;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                {formData.syriaExport && (
                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center">
                                        <Settings className="w-3 h-3 mr-1" />
                                        HS Code Forced: 27101981
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>{/* end scrollable list */}

                    {/* Add button pinned at bottom of card */}
                    <div className="flex justify-center pt-3 mt-2 border-t border-gold-500/10">
                        <Button
                            onClick={addLineItem}
                            className="w-full max-w-sm gap-2 bg-gold-500 hover:bg-gold-600 text-black shadow-[0_0_15px_rgba(239,189,51,0.4)] border-none font-bold transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            {formData.lineItems.length === 0 ? "Add Item" : "Add Another Item"}
                        </Button>
                    </div>
                </div>

                {/* Totals Card */}
                <div className="rounded-xl p-6 gold-glass shadow-sm border-gold-500/20">
                    <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-mono">€{totals.net.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base mt-2">
                        <div className="flex items-center text-muted-foreground">
                            <span>VAT (</span>
                            {formData.syriaExport ? (
                                <span className="mx-1">0</span>
                            ) : (
                                <Input
                                    type="number"
                                    value={formData.vatRate}
                                    onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                                    className="w-12 h-6 text-xs mx-1 px-1 bg-white/50 dark:bg-black/20 text-center"
                                />
                            )}
                            <span>%):</span>
                        </div>
                        <span className="font-mono">€{totals.vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-border/50">
                        <span>Total:</span>
                        <span className="text-gold-500 font-mono">€{totals.gross.toFixed(2)}</span>
                    </div>

                    <Button
                        onClick={handleSave}
                        className="w-full mt-6 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold hover:opacity-90 shadow-[0_0_20px_rgba(212,175,55,0.3)] border-none"
                    >
                        Save & Generate Next Receipt
                    </Button>
                </div>
            </div>

            {/* Right: Preview - sticky full-height panel */}
            <div className="flex flex-col h-full sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-primary">Live Preview</h3>
                </div>
                <div className="flex-1 min-h-0 bg-gray-100 dark:bg-zinc-900 rounded-xl overflow-hidden border shadow-inner">
                    <PDFPreview data={{ ...formData, totalNet: totals.net, vat: totals.vat, totalGross: totals.gross }} />
                </div>
            </div>
        </div>
    );
}
