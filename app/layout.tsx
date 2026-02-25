import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ZoomControl } from "@/components/ZoomControl";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Export Manager",
    description: "Local Export Management System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <ZoomControl />
                <div className="h-full relative flex overflow-hidden">
                    <div className="hidden md:flex flex-col fixed inset-y-0 left-0 z-[80] w-4 hover:w-72 transition-all duration-300 group">
                        <div className="h-full w-72 bg-gray-900 -translate-x-[calc(100%-16px)] group-hover:translate-x-0 transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-r border-white/5 overflow-hidden">
                            <Sidebar />
                        </div>
                    </div>
                    <main className="flex-1 pl-4 h-full w-full overflow-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
