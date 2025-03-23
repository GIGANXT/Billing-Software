import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: "success" | "warning" | "error" | "info";
  children: React.ReactNode;
  className?: string;
}

export function BadgeStatus({ status, children, className }: StatusBadgeProps) {
  const statusStyles = {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium",
        statusStyles[status],
        className
      )}
    >
      {children}
    </Badge>
  );
}
