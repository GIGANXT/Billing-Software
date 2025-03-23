import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { BadgeStatus } from "@/components/ui/badge-status";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface Medicine {
  id: number;
  name: string;
  description: string;
  category_id: number;
  form: string;
  batchNumber: string;
  expiryDate: string;
  mrp: string;
  stock: number;
  lowStockThreshold: number;
  gstRate: string;
}

export interface Category {
  id: number;
  name: string;
}

interface InventoryTableProps {
  medicines: Medicine[];
  categories: Category[];
  onUpdate: () => void;
}

// Schema for medicine form
const medicineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  form: z.string().min(1, "Form is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  mrp: z.string().min(1, "MRP is required"),
  stock: z.string().min(1, "Stock is required"),
  lowStockThreshold: z.string().min(1, "Low stock threshold is required"),
  gstRate: z.string().min(1, "GST rate is required"),
});

type MedicineFormValues = z.infer<typeof medicineSchema>;

// Stock adjustment schema
const stockAdjustmentSchema = z.object({
  stock: z.string().min(1, "Stock quantity is required"),
  reason: z.string().optional(),
});

type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;

export function InventoryTable({ medicines, categories, onUpdate }: InventoryTableProps) {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form for adding/editing medicine
  const form = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      form: "",
      batchNumber: "",
      expiryDate: "",
      mrp: "",
      stock: "",
      lowStockThreshold: "10",
      gstRate: "18",
    },
  });

  // Form for stock adjustment
  const stockForm = useForm<StockAdjustmentValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      stock: "",
      reason: "",
    },
  });

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset();
    setSelectedMedicine(null);
  };

  // Set form values when editing medicine
  const handleEditMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    form.reset({
      name: medicine.name,
      description: medicine.description || "",
      category_id: medicine.category_id.toString(),
      form: medicine.form,
      batchNumber: medicine.batchNumber,
      expiryDate: new Date(medicine.expiryDate).toISOString().split('T')[0],
      mrp: medicine.mrp,
      stock: medicine.stock.toString(),
      lowStockThreshold: medicine.lowStockThreshold.toString(),
      gstRate: medicine.gstRate,
    });
    setIsAddDialogOpen(true);
  };

  // Handle stock adjustment
  const handleStockAdjustment = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    stockForm.reset({
      stock: medicine.stock.toString(),
      reason: "",
    });
    setIsStockDialogOpen(true);
  };

  // Submit medicine form
  const onSubmitMedicine = async (data: MedicineFormValues) => {
    try {
      const payload = {
        ...data,
        category_id: parseInt(data.category_id),
        stock: parseInt(data.stock),
        lowStockThreshold: parseInt(data.lowStockThreshold),
      };

      if (selectedMedicine) {
        // Update existing medicine
        await apiRequest("PATCH", `/api/medicines/${selectedMedicine.id}`, payload);
        toast({
          title: "Medicine updated",
          description: "Medicine has been updated successfully",
        });
      } else {
        // Add new medicine
        await apiRequest("POST", "/api/medicines", payload);
        toast({
          title: "Medicine added",
          description: "Medicine has been added successfully",
        });
      }

      // Invalidate and refetch medicines
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      onUpdate();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save medicine. Please try again.",
      });
    }
  };

  // Handle stock adjustment submission
  const onSubmitStockAdjustment = async (data: StockAdjustmentValues) => {
    if (!selectedMedicine) return;

    try {
      await apiRequest("PATCH", `/api/medicines/${selectedMedicine.id}/stock`, {
        stock: parseInt(data.stock),
      });

      toast({
        title: "Stock updated",
        description: "Stock has been updated successfully",
      });

      // Invalidate and refetch medicines
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      onUpdate();
      setIsStockDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update stock. Please try again.",
      });
    }
  };

  // Delete medicine
  const handleDeleteMedicine = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/medicines/${id}`, undefined);
      
      toast({
        title: "Medicine deleted",
        description: "Medicine has been deleted successfully",
      });

      // Invalidate and refetch medicines
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete medicine. Please try again.",
      });
    }
  };

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  // Check if date is expired
  const isExpired = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  // Check if date is expiring soon (within 30 days)
  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate > today && expiryDate <= thirtyDaysFromNow;
  };

  // Get status of stock
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { status: "error", label: "Out of Stock" };
    if (stock <= threshold) return { status: "warning", label: "Low Stock" };
    return { status: "success", label: "In Stock" };
  };

  // Table columns
  const columns = [
    {
      key: "name",
      header: "Medicine Name",
      cell: (row: Medicine) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.description}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      cell: (row: Medicine) => (
        <div>
          {categories.find(c => c.id === row.category_id)?.name || "Unknown"}
        </div>
      ),
      sortable: true,
    },
    {
      key: "batch",
      header: "Batch",
      cell: (row: Medicine) => <div>{row.batchNumber}</div>,
    },
    {
      key: "expiry",
      header: "Expiry",
      cell: (row: Medicine) => (
        <div className={
          isExpired(row.expiryDate) 
            ? "text-red-600 dark:text-red-400"
            : isExpiringSoon(row.expiryDate)
              ? "text-amber-600 dark:text-amber-400"
              : ""
        }>
          {formatDate(row.expiryDate)}
        </div>
      ),
      sortable: true,
    },
    {
      key: "stock",
      header: "Stock",
      cell: (row: Medicine) => {
        const status = getStockStatus(row.stock, row.lowStockThreshold);
        return (
          <div className="text-sm font-medium">
            <Button 
              variant="ghost" 
              className="p-0 h-auto"
              onClick={() => handleStockAdjustment(row)}
            >
              <BadgeStatus status={status.status as any}>
                {row.stock} Units
              </BadgeStatus>
            </Button>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "mrp",
      header: "MRP",
      cell: (row: Medicine) => <div>₹{parseFloat(row.mrp).toFixed(2)}</div>,
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Medicine) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditMedicine(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the medicine
                  from the inventory.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteMedicine(row.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        data={medicines}
        columns={columns}
        searchKey="name"
      />

      {/* Add/Edit Medicine Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedMedicine ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitMedicine)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicine Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter medicine name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter medicine description"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="form"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select form" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="capsule">Capsule</SelectItem>
                          <SelectItem value="syrup">Syrup</SelectItem>
                          <SelectItem value="injection">Injection</SelectItem>
                          <SelectItem value="ointment">Ointment</SelectItem>
                          <SelectItem value="drops">Drops</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter batch number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP (₹)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter MRP" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock (Units)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select GST rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">
                  {selectedMedicine ? "Update" : "Add"} Medicine
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(onSubmitStockAdjustment)} className="space-y-4">
              <div className="text-sm">
                Current Stock: <span className="font-semibold">{selectedMedicine?.stock || 0} units</span>
              </div>
              <FormField
                control={stockForm.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={stockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Reason for stock adjustment" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Stock</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
