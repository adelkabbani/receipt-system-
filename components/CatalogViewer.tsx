"use client";

import { useState, useEffect, useMemo } from "react";
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image } from "@react-pdf/renderer";
import { COMPANY_CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: { flexDirection: "column", backgroundColor: "#fff", padding: 20, fontFamily: "Helvetica" },

    // Header
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#1a1a2e" },
    headerLeft: { flexDirection: "column" },
    companyName: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },
    companySubtitle: { fontSize: 9, color: "#555", marginTop: 2 },
    headerRight: { alignItems: "flex-end" },
    catalogTitle: { fontSize: 20, fontWeight: "bold", color: "#c8860a", letterSpacing: 2 },
    catalogDate: { fontSize: 9, color: "#888", marginTop: 3 },

    // Category header
    categoryHeader: { backgroundColor: "#1a1a2e", paddingVertical: 5, paddingHorizontal: 8, marginTop: 14, marginBottom: 0, borderRadius: 3 },
    categoryText: { fontSize: 10, fontWeight: "bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },

    // Table
    table: { width: "100%" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#f0f0f0", paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#ddd" },
    tableRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
    tableRowAlt: { backgroundColor: "#fafafa" },

    // Columns
    colCode: { width: "15%", fontSize: 8, color: "#444" },
    colName: { width: "47%", fontSize: 8, color: "#222" },
    colNameWrapper: { width: "47%", flexDirection: "column", paddingRight: 5 },
    colNameText: { fontSize: 8, color: "#222", fontWeight: "bold" },
    colDescText: { fontSize: 6, color: "#666", marginTop: 1.5, paddingRight: 4 },
    colPkg: { width: "13%", fontSize: 8, textAlign: "right", color: "#444" },
    colPrice: { width: "13%", fontSize: 8, textAlign: "right", color: "#222", fontWeight: "bold" },
    colPPL: { width: "12%", fontSize: 8, textAlign: "right", color: "#666" },

    colHeaderText: { fontSize: 8, fontWeight: "bold", color: "#333" },

    // Footer
    footer: { borderTopWidth: 1, borderTopColor: "#ddd", marginTop: 20, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
    footerText: { fontSize: 8, color: "#999" },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

function CatalogDocument({ products, dateStr }: { products: any[]; dateStr: string }) {
    // Group by category
    const grouped = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const p of products) {
            const cat = p.category || "Other";
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(p);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [products]);

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap>
                {/* Header */}
                <View style={styles.header} fixed>
                    <View style={styles.headerLeft}>
                        <Text style={styles.companyName}>{COMPANY_CONFIG.name}</Text>
                        <Text style={styles.companySubtitle}>{COMPANY_CONFIG.slogan}</Text>
                        <Text style={styles.companySubtitle}>{COMPANY_CONFIG.contact.email} · {COMPANY_CONFIG.contact.web}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.catalogTitle}>PRICE LIST</Text>
                        <Text style={styles.catalogDate}>Date: {dateStr}</Text>
                        <Text style={styles.catalogDate}>Total Products: {products.length}</Text>
                    </View>
                </View>

                {/* Table column headers — shown at top of each page */}
                <View style={styles.tableHeaderRow} fixed>
                    <Text style={[styles.colCode, styles.colHeaderText]}>Item Code</Text>
                    <Text style={[styles.colName, styles.colHeaderText]}>Product Name</Text>
                    <Text style={[styles.colPkg, styles.colHeaderText]}>Package</Text>
                    <Text style={[styles.colPrice, styles.colHeaderText]}>Pkg Price</Text>
                    <Text style={[styles.colPPL, styles.colHeaderText]}>Per Unit</Text>
                </View>

                {/* Categories + Products */}
                {grouped.map(([category, items]) => (
                    <View key={category}>
                        {/* Category header */}
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryText}>{category} ({items.length} products)</Text>
                        </View>

                        {/* Product rows */}
                        {items.map((product, idx) => (
                            <View
                                key={product.id}
                                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                            >
                                <Text style={styles.colCode}>{product.itemCode || "—"}</Text>
                                <View style={styles.colNameWrapper}>
                                    <Text style={styles.colNameText}>{product.name}</Text>
                                    {product.description ? (
                                        <Text style={styles.colDescText}>{product.description}</Text>
                                    ) : null}
                                </View>
                                <Text style={styles.colPkg}>
                                    {product.amount || 0}{product.measureUnit || "L"}
                                </Text>
                                <Text style={styles.colPrice}>
                                    €{Number(product.packagePrice || 0).toFixed(2)}
                                </Text>
                                <Text style={styles.colPPL}>
                                    €{Number(product.pricePerLiter || 0).toFixed(2)}/{product.measureUnit || "L"}
                                </Text>
                            </View>
                        ))}
                    </View>
                ))}

                {/* Page footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>{COMPANY_CONFIG.name} — Price List {dateStr}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CatalogViewer({ products, defaultMargin = 0 }: { products: any[], defaultMargin?: number }) {
    const [isClient, setIsClient] = useState(false);
    const [filter, setFilter] = useState<string>("all");
    const [profitMargin, setProfitMargin] = useState<number>(defaultMargin);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Get unique categories for filter
    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map((p) => p.category || "Other"))).sort();
        return cats;
    }, [products]);

    // Filtered products with applied margin
    const filtered = useMemo(() => {
        let list = products;
        if (filter !== "all") {
            list = products.filter((p) => (p.category || "Other") === filter);
        }

        const marginMultiplier = 1 + (profitMargin / 100);

        return list.map(p => ({
            ...p,
            packagePrice: Number(p.packagePrice || 0) * marginMultiplier,
            pricePerLiter: Number(p.pricePerLiter || 0) * marginMultiplier
        }));
    }, [products, filter, profitMargin]);

    const dateStr = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground font-medium">Filter by category:</span>
                <Button
                    size="sm"
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    className="text-xs h-7"
                >
                    All ({products.length})
                </Button>
                {categories.map((cat) => {
                    const count = products.filter((p) => (p.category || "Other") === cat).length;
                    return (
                        <Button
                            key={cat}
                            size="sm"
                            variant={filter === cat ? "default" : "outline"}
                            onClick={() => setFilter(cat)}
                            className="text-xs h-7"
                        >
                            {cat} ({count})
                        </Button>
                    );
                })}

                <div className="ml-auto flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                    <Label className="text-xs font-medium mr-2 whitespace-nowrap">Global Profit Margin %:</Label>
                    <Input
                        type="number"
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                        className="w-16 h-7 text-xs bg-white text-black p-1"
                    />
                </div>
            </div>

            {/* PDF Viewer */}
            {!isClient ? (
                <div className="flex items-center justify-center h-[700px] rounded-md border bg-muted/20 text-muted-foreground">
                    Loading PDF Engine...
                </div>
            ) : (
                <div className="h-[calc(100vh-220px)] min-h-[600px] w-full bg-white rounded-md border shadow-sm">
                    <PDFViewer width="100%" height="100%" showToolbar={true}>
                        <CatalogDocument products={filtered} dateStr={dateStr} />
                    </PDFViewer>
                </div>
            )}
        </div>
    );
}
