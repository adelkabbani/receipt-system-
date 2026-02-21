"use client";

import { Document, Page, Text, View, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { COMPANY_CONFIG, CONTACT_LOCATIONS } from "@/lib/config";

// Define styles for PDF
const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#fff', padding: 15, fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
    headerLeft: { flexDirection: 'column' },
    headerRight: { flexDirection: 'column', alignItems: 'flex-end' },
    title: { fontSize: 14, fontWeight: 'bold', marginBottom: 2, flexWrap: 'wrap', width: 300 },
    subtitle: { fontSize: 10, color: '#333', marginBottom: 2 },
    meta: { fontSize: 10, marginTop: 5 },

    table: { marginTop: 20, width: '100%' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'flex-start', minHeight: 24, paddingVertical: 4 },
    tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },

    colItem: { width: '15%', paddingLeft: 5 },
    colDesc: { width: '35%' },
    colQty: { width: '10%', textAlign: 'right' },
    colLiters: { width: '10%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right', paddingRight: 5 },

    text: { fontSize: 10 },
    subText: { fontSize: 8, color: '#666' },
    headerText: { fontSize: 10, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    totalSection: { marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' },
    totalRow: { flexDirection: 'row', width: '200px', justifyContent: 'space-between', marginBottom: 5 },
    totalLabel: { fontSize: 12, fontWeight: 'bold' },
    totalValue: { fontSize: 12 },
    bankDetails: { fontSize: 8, color: '#666', width: '60%' },
});

// PDF Document Component
const MyDocument = ({ data }: { data: any }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header Section */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                {/* Left Side: Logo + Company Details */}
                <View style={{ flexDirection: 'column', width: '55%' }}>
                    {/* Logo */}
                    {COMPANY_CONFIG.logoPath && (
                        <Image
                            src={window.location.origin + COMPANY_CONFIG.logoPath}
                            style={{ width: 80, marginBottom: 10 }}
                        />
                    )}
                    {/* Company Details */}
                    <Text style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>
                        Shikh Al Ard General Trading
                    </Text>
                    <Text style={{ fontSize: 11, marginBottom: 4, color: '#333' }}>
                        For import and export (Wholesale & Retail)
                    </Text>
                    <Text style={{ fontSize: 10, color: '#555', lineHeight: 1.4 }}>
                        {(data.location === 'damascus' ? CONTACT_LOCATIONS.damascus : CONTACT_LOCATIONS.cairo).replace(' | ', '\n')}
                    </Text>
                </View>

                {/* Right Side: Moller Logo + Offer Details */}
                <View style={{ flexDirection: 'column', alignItems: 'flex-end', width: '40%' }}>
                    {/* Moller Logo */}
                    <Image
                        src={window.location.origin + (data.branch === 'gpc' ? "/gpc_logo.png" : "/moller_logo.png")}
                        style={{ width: 120, marginBottom: 10 }}
                    />
                    {/* Offer Details */}
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>OFFER</Text>
                        <Text style={styles.meta}>#{data.offerNumber || 'DRAFT'}</Text>
                        <Text style={styles.meta}>Date: {data.date ? new Date(data.date).toLocaleDateString() : new Date().toLocaleDateString()}</Text>
                    </View>
                </View>
            </View>

            {/* Client Info */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
                <Text style={{ fontSize: 12, marginBottom: 5 }}>{data.billingName || 'Client Name'}</Text>

                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Location:</Text>
                <Text style={{ fontSize: 12, marginBottom: 5 }}>{data.clientLocation || 'Location'}</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Company Number:</Text>
                <Text style={{ fontSize: 12 }}>{data.clientNumber || 'Number'}</Text>
            </View>

            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.colItem, styles.headerText]}>Item</Text>
                <Text style={[styles.colDesc, styles.headerText]}>Description</Text>
                <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
                <Text style={[styles.colLiters, styles.headerText]}>Package</Text>
                <Text style={[styles.colPrice, styles.headerText]}>Pkg Price</Text>
                <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
            </View>

            {/* Table Rows */}
            {data.lineItems && data.lineItems.map((item: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                    <View style={styles.colItem}>
                        <Text style={styles.text}>{item.itemCode || "-"}</Text>
                        {item.category && <Text style={styles.subText}>{item.category}</Text>}
                    </View>
                    <View style={styles.colDesc}>
                        <Text style={styles.text}>{item.name}</Text>
                        {item.description && <Text style={styles.subText}>{item.description}</Text>}
                    </View>
                    <Text style={[styles.colQty, styles.text]}>{item.quantity}</Text>
                    <Text style={[styles.colLiters, styles.text]}>{item.amount || 0}{item.measureUnit || "L"}</Text>
                    <Text style={[styles.colPrice, styles.text]}>€{Number(item.packagePrice || item.pricePerLiter || 0).toFixed(2)}</Text>
                    <Text style={[styles.colTotal, styles.text]}>
                        {(() => {
                            // Use packagePrice as the single source of truth.
                            // For L products: packagePrice = pricePerLiter × amount (set during product creation/restore)
                            // For kg/g products: packagePrice = total drum price
                            const pkgPrice = Number(item.packagePrice) || (Number(item.amount || 0) * Number(item.pricePerLiter || 0));
                            const total = Number(item.quantity) * pkgPrice;
                            return `€${total.toFixed(2)}`;
                        })()}
                    </Text>
                </View>
            ))}

            {/* Totals */}
            <View style={styles.totalSection}>
                <View style={{ flexDirection: 'column' }}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>€{data.totalNet ? data.totalNet.toFixed(2) : '0.00'}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>VAT ({data.syriaExport ? 0 : data.vatRate}%):</Text>
                        <Text style={styles.totalValue}>€{data.vat ? data.vat.toFixed(2) : '0.00'}</Text>
                    </View>
                    <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }]}>
                        <Text style={styles.totalLabel}>TOTAL:</Text>
                        <Text style={[styles.totalValue, { fontSize: 14, fontWeight: 'bold' }]}>
                            €{data.totalGross ? data.totalGross.toFixed(2) : '0.00'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.footer, { justifyContent: 'flex-end' }]}>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: '#999' }}>{COMPANY_CONFIG.contact.web}</Text>
                    <Text style={{ fontSize: 10, color: '#999', marginBottom: 5 }}>{COMPANY_CONFIG.contact.email}</Text>
                    <Text
                        style={{ fontSize: 9, color: '#333', fontWeight: 'bold' }}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                        fixed
                    />
                </View>
            </View>

        </Page>
    </Document>
);

export default function PDFPreview({ data }: { data: any }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <div className="flex items-center justify-center h-full text-muted-foreground">Loading PDF Engine...</div>;

    return (
        <div className="h-[600px] w-full bg-white rounded-md border shadow-sm">
            <PDFViewer width="100%" height="100%" showToolbar={true}>
                <MyDocument data={data} />
            </PDFViewer>
        </div>
    );
}
