import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InventoryTable } from "@/components/inventory/inventory-table";

// Schema for adding a new category
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Inventory() {
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const { toast } = useToast();

  // Category form
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch medicines
  const { data: medicines = [], refetch: refetchMedicines } = useQuery({
    queryKey: ["/api/medicines"],
    queryFn: async () => {
      const res = await fetch("/api/medicines", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch medicines");
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Add new category
  const onSubmitCategory = async (data: CategoryFormValues) => {
    try {
      await apiRequest("POST", "/api/categories", data);
      
      toast({
        title: "Category added",
        description: "Category has been added successfully",
      });
      
      // Refetch categories
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      refetchCategories();
      
      // Close dialog and reset form
      setIsAddCategoryDialogOpen(false);
      categoryForm.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add category. Please try again.",
      });
    }
  };

  // Export inventory data as CSV
  const exportInventory = () => {
    if (medicines.length === 0) {
      toast({
        variant: "destructive",
        title: "No data",
        description: "There is no inventory data to export.",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "ID", 
      "Name", 
      "Description", 
      "Category", 
      "Form", 
      "Batch Number", 
      "Expiry Date", 
      "MRP", 
      "Stock", 
      "Low Stock Threshold", 
      "GST Rate"
    ];
    
    const csvContent = [
      headers.join(","),
      ...medicines.map((med: any) => [
        med.id,
        `"${med.name.replace(/"/g, '""')}"`,
        `"${(med.description || '').replace(/"/g, '""')}"`,
        `"${categories.find((c: any) => c.id === med.category_id)?.name || 'Unknown'}"`,
        `"${med.form}"`,
        `"${med.batchNumber}"`,
        `"${new Date(med.expiryDate).toLocaleDateString()}"`,
        med.mrp,
        med.stock,
        med.lowStockThreshold,
        med.gstRate
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add New Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
              </DialogHeader>
              {/* Medicine form is implemented in InventoryTable component */}
              <p className="text-center text-muted-foreground">
                The medicine form will be shown here.
              </p>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Add Category</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={exportInventory}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <InventoryTable 
            medicines={medicines} 
            categories={categories}
            onUpdate={() => {
              refetchMedicines();
              refetchCategories();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
