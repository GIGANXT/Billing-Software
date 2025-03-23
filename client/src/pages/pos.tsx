import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedicineCard, MedicineItem } from "@/components/pos/medicine-card";
import { Cart, CartItem } from "@/components/pos/cart";
import { Search, Filter, BarcodeScannerIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function POS() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const { toast } = useToast();

  // Fetch medicines
  const { data: medicines = [], isLoading: medicinesLoading } = useQuery({
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
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Filter medicines based on search term and category
  const filteredMedicines = medicines.filter((medicine: any) => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          medicine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || medicine.category_id === parseInt(category);
    return matchesSearch && matchesCategory;
  });

  // Add medicine to cart
  const addToCart = (medicine: MedicineItem) => {
    setCartItems(prev => {
      // Check if medicine already exists in cart
      const existingItemIndex = prev.findIndex(item => item.medicineId === medicine.id);
      
      if (existingItemIndex >= 0) {
        // Medicine exists, update quantity
        const updatedItems = [...prev];
        const item = updatedItems[existingItemIndex];
        
        // Ensure we don't exceed available stock
        if (item.quantity < medicine.stock) {
          const newQuantity = item.quantity + 1;
          const unitPrice = parseFloat(medicine.mrp);
          const gstRate = parseFloat(medicine.gstRate);
          const gstAmount = (unitPrice * newQuantity * gstRate) / 100;
          const totalPrice = (unitPrice * newQuantity) + gstAmount;
          
          updatedItems[existingItemIndex] = {
            ...item,
            quantity: newQuantity,
            gstAmount,
            totalPrice
          };
          
          return updatedItems;
        } else {
          toast({
            variant: "destructive",
            title: "Stock limit reached",
            description: `Only ${medicine.stock} units available in stock.`,
          });
          return prev;
        }
      } else {
        // Add new medicine to cart
        const unitPrice = parseFloat(medicine.mrp);
        const gstRate = parseFloat(medicine.gstRate);
        const gstAmount = (unitPrice * gstRate) / 100;
        const totalPrice = unitPrice + gstAmount;
        
        return [...prev, {
          medicineId: medicine.id,
          medicine,
          quantity: 1,
          unitPrice,
          gstRate,
          gstAmount,
          totalPrice
        }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (medicineId: number) => {
    setCartItems(prev => prev.filter(item => item.medicineId !== medicineId));
  };

  // Update item quantity in cart
  const updateQuantity = (medicineId: number, quantity: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.medicineId === medicineId) {
          const unitPrice = item.unitPrice;
          const gstRate = item.gstRate;
          const gstAmount = (unitPrice * quantity * gstRate) / 100;
          const totalPrice = (unitPrice * quantity) + gstAmount;
          
          return {
            ...item,
            quantity,
            gstAmount,
            totalPrice
          };
        }
        return item;
      });
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Generate invoice
  const generateInvoice = async () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty cart",
        description: "Please add items to the cart before generating an invoice.",
      });
      return;
    }

    setIsGeneratingInvoice(true);

    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const gstAmount = cartItems.reduce((sum, item) => sum + item.gstAmount, 0);
      const total = subtotal + gstAmount;

      // Create invoice
      const invoiceData = {
        invoice: {
          customerId: null, // Could be updated with selected customer ID
          doctorId: null, // Could be updated with selected doctor ID
          subtotal: subtotal.toString(),
          gstAmount: gstAmount.toString(),
          total: total.toString(),
        },
        items: cartItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          gstRate: item.gstRate.toString(),
          gstAmount: item.gstAmount.toString(),
          totalPrice: item.totalPrice.toString(),
        }))
      };

      await apiRequest("POST", "/api/invoices", invoiceData);

      toast({
        title: "Invoice generated",
        description: "Invoice has been generated successfully.",
      });

      // Clear cart after successful invoice generation
      clearCart();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/top-selling"] });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
      {/* Left Panel: Medicine Search and Selection */}
      <div className="lg:col-span-2 p-4 md:p-6 overflow-y-auto bg-white dark:bg-slate-800 border-r border-border">
        {/* Search Bar */}
        <div className="flex w-full mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search medicines by name or scan barcode"
              className="pl-10 pr-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button variant="ghost" size="icon" className="h-full text-muted-foreground hover:text-foreground">
                <BarcodeScannerIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button className="ml-2" variant="outline">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
        
        {/* Category Tabs */}
        <Tabs defaultValue="all" onValueChange={setCategory}>
          <TabsList className="mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat: any) => (
              <TabsTrigger key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {/* Medicine Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicinesLoading ? (
                // Loading skeletons
                Array(6).fill(0).map((_, index) => (
                  <Card key={index} className="bg-slate-50 dark:bg-slate-800">
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredMedicines.length === 0 ? (
                <div className="col-span-3 py-12 text-center">
                  <p className="text-muted-foreground">No medicines found matching your search criteria.</p>
                </div>
              ) : (
                filteredMedicines.map((medicine: any) => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={{
                      id: medicine.id,
                      name: medicine.name,
                      description: medicine.description || "",
                      form: medicine.form,
                      category: categories.find((c: any) => c.id === medicine.category_id)?.name || "Unknown",
                      stock: medicine.stock,
                      mrp: medicine.mrp,
                      lowStockThreshold: medicine.lowStockThreshold,
                      gstRate: medicine.gstRate,
                    }}
                    onAddToCart={addToCart}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          {/* One TabsContent for each category */}
          {categories.map((cat: any) => (
            <TabsContent key={cat.id} value={cat.id.toString()} className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMedicines.length === 0 ? (
                  <div className="col-span-3 py-12 text-center">
                    <p className="text-muted-foreground">No medicines found in this category.</p>
                  </div>
                ) : (
                  filteredMedicines.map((medicine: any) => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={{
                        id: medicine.id,
                        name: medicine.name,
                        description: medicine.description || "",
                        form: medicine.form,
                        category: cat.name,
                        stock: medicine.stock,
                        mrp: medicine.mrp,
                        lowStockThreshold: medicine.lowStockThreshold,
                        gstRate: medicine.gstRate,
                      }}
                      onAddToCart={addToCart}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Right Panel: Cart */}
      <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-border flex flex-col h-full">
        <Cart
          items={cartItems}
          onClearCart={clearCart}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onGenerateInvoice={generateInvoice}
          loading={isGeneratingInvoice}
        />
      </div>
    </div>
  );
}
