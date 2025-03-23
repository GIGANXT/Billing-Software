import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  description,
  change,
  icon,
  className,
  children,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          {change !== undefined && (
            <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
              {change >= 0 ? <ArrowUp className="h-4 w-4 inline mr-1" /> : <ArrowDown className="h-4 w-4 inline mr-1" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        <p className="text-3xl font-bold mb-2">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
