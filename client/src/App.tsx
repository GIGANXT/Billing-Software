import { Header } from "@/components/layout/header";
import { useEffect, useState } from "react";
import { User, getCurrentUser } from "./lib/auth";
import { LanguageProvider } from "@/contexts/language-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/query";
import { Login } from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import POS from "@/pages/pos";
import Inventory from "@/pages/inventory";
import Patients from "@/pages/patients";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";


function AuthenticatedApp({ user }: { user: User }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen">
      <Header user={user} />
      <main className="flex-1 overflow-y-auto p-4">
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
  );
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
}

export default App;