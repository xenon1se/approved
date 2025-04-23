import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change: {
    value: string | number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor,
  iconColor
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <span className={cn("p-2 rounded-full", iconBgColor, iconColor)}>
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold mt-2 mb-1">{value}</p>
        <p className={cn(
          "text-xs flex items-center",
          change.isPositive ? "text-green-600" : "text-red-600"
        )}>
          {change.isPositive ? (
            <ArrowUpIcon className="mr-1 h-3 w-3" />
          ) : (
            <ArrowDownIcon className="mr-1 h-3 w-3" />
          )}
          <span>{change.value}</span> from last week
        </p>
      </CardContent>
    </Card>
  );
}
