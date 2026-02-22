"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSettings, updateSettings } from "@/app/inventory/actions";
import { Settings as SettingsIcon, Save, Building2, Percent, TrendingUp, Hash } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        companyName: "",
        defaultVatRate: 0,
        defaultProfitMargin: 0,
        logoPath: "",
        nextReceiptNumber: 1
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                setSettings({
                    companyName: data.companyName,
                    defaultVatRate: data.defaultVatRate,
                    defaultProfitMargin: data.defaultProfitMargin,
                    logoPath: data.logoPath || "",
                    nextReceiptNumber: data.nextReceiptNumber || 1
                });
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings(settings);
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Failed to update settings", error);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
                    <SettingsIcon className="h-6 w-6 text-gold-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Manage your global company defaults and receipt configuration.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="gold-glass border-gold-500/20 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gold-gradient opacity-[0.03] pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gold-500" />
                            Company Profile
                        </CardTitle>
                        <CardDescription>These details will appear on your receipts and PDF exports.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                className="bg-black/20 border-gold-500/20 focus:border-gold-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logoPath">Logo Path (Internal Asset)</Label>
                            <Input
                                id="logoPath"
                                value={settings.logoPath}
                                onChange={(e) => setSettings({ ...settings, logoPath: e.target.value })}
                                placeholder="/kinan logo .png"
                                className="bg-black/20 border-gold-500/20 focus:border-gold-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="gold-glass border-gold-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wider">
                                <Percent className="h-4 w-4 text-gold-500" />
                                Default VAT
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={settings.defaultVatRate}
                                    onChange={(e) => setSettings({ ...settings, defaultVatRate: parseFloat(e.target.value) })}
                                    className="pl-9 bg-black/20 border-gold-500/20 focus:border-gold-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gold-glass border-gold-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2 uppercase tracking-wider">
                                <TrendingUp className="h-4 w-4 text-gold-500" />
                                Default Profit Margin
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={settings.defaultProfitMargin}
                                    onChange={(e) => setSettings({ ...settings, defaultProfitMargin: parseFloat(e.target.value) })}
                                    className="pl-9 bg-black/20 border-gold-500/20 focus:border-gold-500"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="gold-glass border-gold-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Hash className="h-5 w-5 text-gold-500" />
                            Sequence Control
                        </CardTitle>
                        <CardDescription>Manually override the next generated receipt number.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="nextOfferNumber">Next Receipt Number (Numeric Part)</Label>
                            <Input
                                id="nextOfferNumber"
                                type="number"
                                value={settings.nextReceiptNumber}
                                onChange={(e) => setSettings({ ...settings, nextReceiptNumber: parseInt(e.target.value) || 0 })}
                                className="bg-black/20 border-gold-500/20 focus:border-gold-500"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                Next receipt will be: <span className="text-gold-500 font-bold">OFF-{settings.nextReceiptNumber.toString().padStart(4, '0')}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-gold-600 hover:bg-gold-500 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] border-none flex items-center gap-2 group transition-all duration-300"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        ) : (
                            <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        )}
                        Save Configuration
                    </Button>
                </div>
            </form>
        </div>
    );
}
