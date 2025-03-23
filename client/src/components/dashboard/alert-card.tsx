import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { BadgeStatus } from "@/components/ui/badge-status";

interface AlertItem {
  id: number;
  name: string;
  value: string;
  status: "warning" | "error";
}

interface AlertCardProps {
  title: string;
  count: number | string;
  description: string;
  items: AlertItem[];
  icon?: "alert" | "calendar";
}

export function AlertCard({ title, count, description, items, icon = "alert" }: AlertCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className={icon === "alert" ? "text-amber-500" : "text-red-500"}>
            {icon === "alert" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CalendarDays className="h-5 w-5" />
            )}
          </span>
        </div>
        <p className="text-3xl font-bold mb-2">{count}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="text-sm">{item.name}</span>
              <BadgeStatus status={item.status}>
                {item.value}
              </BadgeStatus>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
