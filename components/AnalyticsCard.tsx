import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
}

export function AnalyticsCard({ title, value, description, icon: Icon }: AnalyticsCardProps) {
    return (
        <div className="gold-glass rounded-xl p-6 shadow-sm border-gold-500/20">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">{title}</h3>
                <Icon className="h-4 w-4 text-gold-500" />
            </div>
            <div className="mt-2">
                <div className="text-2xl font-bold text-primary">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
