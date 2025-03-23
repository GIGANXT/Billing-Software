import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Plus, 
  AlertTriangle, 
  XCircle,
  FileSignature
} from "lucide-react";
import { format } from "date-fns";

type ActivityType = "new-stock" | "invoice" | "low-stock" | "expired" | "prescription";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
  className?: string;
}

export function RecentActivity({ activities, className }: RecentActivityProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "new-stock":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500">
            <Plus className="h-4 w-4" />
          </div>
        );
      case "invoice":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "low-stock":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      case "expired":
        return (
          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-500">
            <XCircle className="h-4 w-4" />
          </div>
        );
      case "prescription":
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-500">
            <FileSignature className="h-4 w-4" />
          </div>
        );
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} minutes ago`;
    if (diff < 24 * 60) return `${Math.floor(diff / 60)} hours ago`;
    return format(date, "dd MMM, yyyy");
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            {getActivityIcon(activity.type)}
            <div className="ml-3">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
