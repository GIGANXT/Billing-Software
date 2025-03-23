import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Save, Printer, Search } from "lucide-react";
import { MedicineItem } from "./medicine-card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { generateInvoicePDF } from "@/lib/utils/invoice";

export interface CartItem {
  medicineId: number;
  medicine: MedicineItem;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  totalPrice: number;
}

interface CartProps {
  items: CartItem[];
  onClearCart: () => void;
  onRemoveItem: (medicineId: number) => void;
  onUpdateQuantity: (medicineId: number, quantity: number) => void;
  onGenerateInvoice: () => Promise<void>;
  loading: boolean;
}

export function Cart({
  items,
  onClearCart,
  onRemoveItem,
  onUpdateQuantity,
  onGenerateInvoice,
  loading,
}: CartProps) {
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Customer search form
  const form = useForm({
    defaultValues: {
      name: "",
      phone: "",
      doctorId: "",
    },
  });

  // Get customer by phone
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["/api/customers/phone", customerPhone],
    queryFn: async () => {
      if (!customerPhone) return null;
      try {
        const res = await fetch(`/api/customers/phone/${customerPhone}`, {
          credentials: "include",
        });
        if (res.status === 404) return null;
        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        console.error("Error fetching customer:", error);
        return null;
      }
    },
    enabled: customerPhone.length > 0 && searchingCustomer,
  });

  // Get doctors for dropdown
  const { data: doctors } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: async () => {
      const res = await fetch("/api/doctors", {
        credentials: "include",
      });
      await throwIfResNotOk(res);
      return await res.json();
    },
  });

  // Update form with customer data if found
  useState(() => {
    if (customer) {
      form.setValue("name", customer.name);
      form.setValue("phone", customer.phone);
    }
  });

  const findCustomer = () => {
    setSearchingCustomer(true);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
  const total = subtotal + gstAmount;

  // Generate invoice
  const handleGenerateInvoice = async () => {
    if (items.length === 0) return;
    
    await onGenerateInvoice();
    
    const currentDate = new Date();
    
    generateInvoicePDF({
      invoiceNumber: `INV-${currentDate.getTime().toString().substr(0, 10)}`,
      date: currentDate,
      customer: customer,
      doctorName: doctors?.find((d: any) => d.id === parseInt(form.getValues("doctorId")))?.name,
      items,
      subtotal,
      gstAmount,
      total,
      userInfo: {
        name: "Administrator", // This would come from auth context in real app
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="px-4 py-4 border-b">
        <CardTitle className="text-lg">Current Bill</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-primary mr-2"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span className="text-sm text-muted-foreground">
              Items: <span>{items.length}</span>
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearCart}
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear All
          </Button>
        </div>
      </CardHeader>

      <Card className="border-0 shadow-none rounded-none">
        <CardHeader className="px-4 py-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Customer Information</h4>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={findCustomer}
            >
              <Search className="h-3 w-3 mr-1" /> Find
            </Button>
          </div>
          <Form {...form}>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Customer Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Mobile Number"
                        {...field}
                        value={customerPhone || field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setCustomerPhone(e.target.value);
                          setSearchingCustomer(false);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {doctors?.map((doctor: any) => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                              Dr. {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-muted-foreground mb-4 opacity-20"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add medicines from the left panel
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.medicineId}
                  className="flex justify-between items-center p-2 border-b dark:border-slate-700"
                >
                  <div>
                    <p className="font-medium">{item.medicine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.unitPrice.toFixed(2)} x{" "}
                      <input
                        type="number"
                        min="1"
                        max={item.medicine.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value);
                          if (quantity > 0 && quantity <= item.medicine.stock) {
                            onUpdateQuantity(item.medicineId, quantity);
                          }
                        }}
                        className="w-12 inline-block px-1 py-0 border rounded text-center"
                      />
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">₹{item.totalPrice.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onRemoveItem(item.medicineId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col border-t p-4">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%):</span>
              <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t">
              <span>Grand Total:</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <Button variant="outline" disabled={items.length === 0 || loading}>
              <Save className="h-4 w-4 mr-2" /> Save Bill
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              disabled={items.length === 0 || loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" /> Print Bill
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
