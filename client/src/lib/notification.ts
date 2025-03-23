
import { toast } from "@/components/ui/use-toast";

const notificationSound = new Audio("/notification.mp3");

export const playNotification = () => {
  notificationSound.play().catch(err => console.error("Error playing notification:", err));
};

export const notifyWithSound = (title: string, description?: string, variant: "default" | "destructive" = "default") => {
  playNotification();
  toast({
    title,
    description,
    variant
  });
};
