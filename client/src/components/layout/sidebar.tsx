import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User, logout } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface SidebarProps {
  user: User;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

function NavItem({ icon, label, href, active }: NavItemProps) {
  return (
    <Link href={href}>
      <Button
        variant={active ? "secondary" : "ghost"}
        className="w-full justify-start"
      >
        {icon}
        <span className="ml-2">{label}</span>
      </Button>
    </Link>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const currentPath = location || "/dashboard";

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred while logging out",
      });
    }
  };

  const sidebarContent = (
    <>
      <div className="px-4 py-6">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary mr-2"
          >
            <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </svg>
          <h1 className="text-xl font-bold text-primary">MediTrack</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Medical Billing System</p>
      </div>
      
      <div className="flex-1 px-4 py-2 space-y-1">
        <NavItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          href="/dashboard"
          active={currentPath === "/dashboard" || currentPath === "/"}
        />
        <NavItem
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Point of Sale"
          href="/pos"
          active={currentPath === "/pos"}
        />
        <NavItem
          icon={<Package2 className="h-5 w-5" />}
          label="Inventory"
          href="/inventory"
          active={currentPath === "/inventory"}
        />
        <NavItem
          icon={<Users className="h-5 w-5" />}
          label="Patients"
          href="/patients"
          active={currentPath === "/patients"}
        />
        <NavItem
          icon={<BarChart2 className="h-5 w-5" />}
          label="Reports"
          href="/reports"
          active={currentPath === "/reports"}
        />
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          href="/settings"
          active={currentPath === "/settings"}
        />
      </div>
      
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center p-4 bg-background border-b border-border h-16">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-64">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <div className="flex items-center ml-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-primary mr-2"
          >
            <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </svg>
          <h1 className="text-lg font-bold text-primary">MediTrack</h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border">
        {sidebarContent}
      </aside>
    </>
  );
}
