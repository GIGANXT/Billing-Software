import { Bell, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [alertsCount, setAlertsCount] = useState(3); // Initial value from design

  // Mock fetch low stock and expiring medicines for alerts
  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
    queryFn: async () => {
      const [lowStockRes, expiringRes] = await Promise.all([
        fetch("/api/medicines/low-stock", { credentials: "include" }),
        fetch("/api/medicines/expiring?days=30", { credentials: "include" }),
      ]);
      
      if (!lowStockRes.ok || !expiringRes.ok) {
        return { lowStock: [], expiring: [] };
      }
      
      const lowStock = await lowStockRes.json();
      const expiring = await expiringRes.json();
      
      setAlertsCount(lowStock.length + expiring.length);
      return { lowStock, expiring };
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const getPageTitle = () => {
    const path = location || "";
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path === "/pos") return "Point of Sale";
    if (path === "/inventory") return "Inventory";
    if (path === "/patients") return "Patients";
    if (path === "/reports") return "Reports";
    if (path === "/settings") return "Settings";
    return "MediTrack";
  };

  return (
    <div className="border-b border-border bg-background p-4 flex items-center justify-between sticky top-0 z-10 h-16">
      <h2 className="text-xl font-semibold hidden md:block">{getPageTitle()}</h2>
      <div className="flex items-center space-x-3 ml-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {alertsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white">
                  {alertsCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {alerts?.lowStock.length === 0 && alerts?.expiring.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                No alerts at this time
              </div>
            ) : (
              <>
                {alerts?.lowStock.slice(0, 3).map((medicine: any) => (
                  <DropdownMenuItem key={`low-${medicine.id}`} className="flex flex-col items-start">
                    <div className="flex items-center w-full">
                      <Badge variant="outline" className="mr-2 bg-amber-100 text-amber-800 border-amber-200">
                        Low Stock
                      </Badge>
                      <span className="font-medium">{medicine.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      Only {medicine.stock} units left
                    </span>
                  </DropdownMenuItem>
                ))}
                
                {alerts?.expiring.slice(0, 3).map((medicine: any) => (
                  <DropdownMenuItem key={`exp-${medicine.id}`} className="flex flex-col items-start">
                    <div className="flex items-center w-full">
                      <Badge variant="outline" className="mr-2 bg-red-100 text-red-800 border-red-200">
                        Expiring Soon
                      </Badge>
                      <span className="font-medium">{medicine.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      Expires on {new Date(medicine.expiryDate).toLocaleDateString()}
                    </span>
                  </DropdownMenuItem>
                ))}
                
                {(alerts?.lowStock.length || 0) + (alerts?.expiring.length || 0) > 6 && (
                  <DropdownMenuItem className="text-center text-primary">
                    View all alerts
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
