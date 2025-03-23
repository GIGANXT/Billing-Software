import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Plus } from "lucide-react";

export interface MedicineItem {
  id: number;
  name: string;
  description: string;
  form: string;
  category: string;
  stock: number;
  mrp: string;
  lowStockThreshold: number;
  gstRate: string;
}

interface MedicineCardProps {
  medicine: MedicineItem;
  onAddToCart: (medicine: MedicineItem) => void;
}

export function MedicineCard({ medicine, onAddToCart }: MedicineCardProps) {
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { status: "error", label: "Out of Stock" };
    if (stock <= threshold) return { status: "warning", label: "Low Stock" };
    return { status: "success", label: "In Stock" };
  };

  const stockStatus = getStockStatus(medicine.stock, medicine.lowStockThreshold);

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer bg-slate-50 dark:bg-slate-800"
      onClick={() => medicine.stock > 0 && onAddToCart(medicine)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{medicine.name}</h4>
            <p className="text-xs text-muted-foreground">{medicine.form} • {medicine.category}</p>
          </div>
          <BadgeStatus status={stockStatus.status as any}>
            {stockStatus.label}
          </BadgeStatus>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <p className="font-medium">
            ₹{parseFloat(medicine.mrp).toFixed(2)} 
            <span className="text-xs text-muted-foreground">/ {medicine.form.toLowerCase()}</span>
          </p>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-primary hover:text-primary/80"
            disabled={medicine.stock === 0}
            onClick={(e) => {
              e.stopPropagation();
              if (medicine.stock > 0) {
                onAddToCart(medicine);
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
