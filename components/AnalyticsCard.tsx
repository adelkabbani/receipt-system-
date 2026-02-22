import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    className?: string;
}

export function AnalyticsCard({ title, value, description, icon: Icon, className }: AnalyticsCardProps) {
    return (
        <div className={cn(
            "gold-glass rounded-2xl p-6 shadow-sm border border-gold-500/10 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(212,175,55,0.15)] hover:-translate-y-1 group",
            className
        )}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-gold-500 transition-colors">{title}</h3>
                <div className="p-2 bg-gold-500/5 rounded-lg group-hover:bg-gold-500/10 transition-colors">
                    <Icon className="h-4 w-4 text-gold-500" />
                </div>
            </div>
            <div className="mt-2">
                <div className="text-2xl font-black tracking-tight text-foreground">{value}</div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 mt-1">{description}</p>
            </div>
        </div>
    );
}
