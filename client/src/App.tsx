import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import POS from "@/pages/pos";
import Inventory from "@/pages/inventory";
import Patients from "@/pages/patients";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useEffect, useState } from "react";
import { User, getCurrentUser } from "./lib/auth";
import { LanguageProvider } from "@/contexts/language-context";

function AuthenticatedApp({ user }: { user: User }) {
  const [location] = useLocation();

  useEffect(() => {
    // Update document title based on current location
    const pageName = location.split("/")[1] || "dashboard";
    document.title = `MediTrack - ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`;
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 pt-16 md:pt-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/pos" component={POS} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/patients" component={Patients} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="meditrack-theme">
        <LanguageProvider>
          {loading ? (
            <div className="flex h-screen items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : user ? (
            <AuthenticatedApp user={user} />
          ) : (
            <Switch>
              <Route path="/login">
                <Login onLoginSuccess={setUser} />
              </Route>
              <Route>
                <Login onLoginSuccess={setUser} />
              </Route>
            </Switch>
          )}
          <Toaster />
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Redirect to dashboard if logged in and at login page
        if (currentUser && location === "/login") {
          setLocation("/dashboard");
        }
        
        // Redirect to login if not logged in and not at login page
        if (!currentUser && location !== "/login") {
          setLocation("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [location, setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="meditrack-theme">
        {loading ? (
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : user ? (
          <AuthenticatedApp user={user} />
        ) : (
          <Switch>
            <Route path="/login">
              <Login onLoginSuccess={setUser} />
            </Route>
            <Route>
              <Login onLoginSuccess={setUser} />
            </Route>
          </Switch>
        )}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
