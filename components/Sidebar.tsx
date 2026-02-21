"use client";

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Package, FileText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const routes = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/', color: "text-sky-500" },
    { label: 'Inventory', icon: Package, href: '/inventory', color: "text-violet-500" },
    { label: 'Offers', icon: Tag, href: '/offers', color: "text-orange-500" },
    { label: 'Receipts', icon: FileText, href: '/offers/new', color: "text-pink-700" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-10 group">
                    <div className="relative w-14 h-14 mr-3 flex-shrink-0 transition-transform group-hover:scale-110">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold leading-tight text-white/90 group-hover:text-white transition-colors">
                            Shikh AlArd
                        </h1>
                        <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-medium leading-none">
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
