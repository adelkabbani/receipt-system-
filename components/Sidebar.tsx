"use client";

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Package, FileText, Tag, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const routes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/', color: "text-sky-500" },
    { label: 'Inventory', icon: Package, href: '/inventory', color: "text-violet-500" },
    { label: 'Offers', icon: Tag, href: '/offers', color: "text-orange-500" },
    { label: 'Receipts', icon: FileText, href: '/offers/new', color: "text-pink-700" },
    { label: 'Settings', icon: Settings, href: '/settings', color: "text-gray-400" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex flex-col items-center mb-10 group">
                    <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                        {/* Golden pulsing ring */}
                        <div className="absolute inset-0 rounded-full bg-gold-500/20 animate-pulse-gold" />

                        {/* Gold Glass Pod */}
                        <div className="gold-glass relative w-16 h-16 rounded-full flex items-center justify-center p-2 border-gold-500/30 overflow-hidden">
                            {/* Shine overlay */}
                            <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-20 transition-opacity animate-shine pointer-events-none" />

                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={48}
                                height={48}
                                className="object-contain relative z-10"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black leading-tight bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-500 uppercase tracking-wider">
                            Shikh AlArd
                        </h1>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-gold-300/60 font-medium leading-none mt-1">
                            General Trading
                        </span>
                    </div>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn("text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
