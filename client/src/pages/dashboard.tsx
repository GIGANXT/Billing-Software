import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AlertCard } from "@/components/dashboard/alert-card";
import { TopSellingTable, TopSellingMedicine } from "@/components/dashboard/top-selling-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { format, subDays } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export default function Dashboard() {
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);

  // Fetch low stock medicines
  const { data: lowStockMedicines = [] } = useQuery({
    queryKey: ["/api/medicines/low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/medicines/low-stock", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch low stock medicines");
      return res.json();
    },
  });

  // Fetch expiring medicines
  const { data: expiringMedicines = [] } = useQuery({
    queryKey: ["/api/medicines/expiring"],
    queryFn: async () => {
      const res = await fetch("/api/medicines/expiring?days=30", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch expiring medicines");
      return res.json();
    },
  });

  // Fetch top selling medicines
  const { data: topSellingMedicines = [] } = useQuery({
    queryKey: ["/api/analytics/top-selling"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/top-selling?limit=5", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch top selling medicines");
      return res.json();
    },
  });

  // Fetch daily sales
  const { data: dailySales = [] } = useQuery({
    queryKey: ["/api/analytics/daily-sales"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/daily-sales?days=7", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch daily sales");
      return res.json();
    },
  });

  // Format daily sales data for chart
  useEffect(() => {
    if (dailySales.length > 0) {
      const formattedData = dailySales.map((item: any) => ({
        date: format(new Date(item.date), "dd MMM"),
        amount: item.sales,
      })).reverse();
      
      setDailySalesData(formattedData);
    }
  }, [dailySales]);

  // Mock recent activity data
  const recentActivity = [
    {
      id: 1,
      type: "new-stock" as const,
      title: "New stock added",
      description: "50 units of Paracetamol",
      timestamp: subDays(new Date(), 0.007), // 10 minutes ago
    },
    {
      id: 2,
      type: "invoice" as const,
      title: "Invoice #1234 generated",
      description: "For Amit Kumar",
      timestamp: subDays(new Date(), 0.025), // 35 minutes ago
    },
    {
      id: 3,
      type: "low-stock" as const,
      title: "Low stock alert",
      description: "Amoxicillin 250mg (5 left)",
      timestamp: subDays(new Date(), 0.084), // 2 hours ago
    },
    {
      id: 4,
      type: "expired" as const,
      title: "Expired medicine removed",
      description: "20 units of Disprin",
      timestamp: subDays(new Date(), 0.2), // 5 hours ago
    },
  ];

  // Format low stock items for display
  const lowStockItems = lowStockMedicines.slice(0, 3).map((med: any) => ({
    id: med.id,
    name: med.name,
    value: `${med.stock} left`,
    status: med.stock === 0 ? "error" : "warning",
  }));

  // Format expiring items for display
  const expiringItems = expiringMedicines.slice(0, 3).map((med: any) => {
    const today = new Date();
    const expiryDate = new Date(med.expiryDate);
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: med.id,
      name: med.name,
      value: `${daysLeft} days left`,
      status: daysLeft <= 5 ? "error" : "warning",
    };
  });

  // Calculate total sales for today
  const todaySales = dailySales.length > 0 ? dailySales[0].sales : 0;
  const todayTransactions = dailySales.length > 0 ? dailySales[0].transactions : 0;

  // Calculate sales change percentage (comparing today with yesterday)
  const yesterdaySales = dailySales.length > 1 ? dailySales[1].sales : 0;
  const salesChange = yesterdaySales > 0 
    ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) 
    : 0;

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Daily Sales Card */}
        <StatsCard
          title="Daily Sales"
          value={`₹${todaySales.toLocaleString()}`}
          description={`${todayTransactions} transactions today`}
          change={salesChange}
        >
          <div className="h-16 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySalesData}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={() => ''} />
                <Tooltip
                  formatter={(value: number) => [`₹${value}`, 'Sales']}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatsCard>
        
        {/* Low Stock Card */}
        <AlertCard
          title="Low Stock Alert"
          count={lowStockMedicines.length}
          description="Requiring immediate restock"
          items={lowStockItems}
          icon="alert"
        />
        
        {/* Expiry Alert Card */}
        <AlertCard
          title="Expiry Alert"
          count={expiringMedicines.length}
          description="Expiring within 30 days"
          items={expiringItems}
          icon="calendar"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Medicines */}
        <TopSellingTable 
          medicines={topSellingMedicines as TopSellingMedicine[]} 
        />
        
        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}
