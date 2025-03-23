import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage
} from "@/components/ui/form";
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
import { Plus, User, Shield, Store, Printer, Sun, Moon, Laptop } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";

// Schema for adding a new user
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "pharmacist", "accountant"]),
});

type UserFormValues = z.infer<typeof userSchema>;

// Schema for adding a new doctor
const doctorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialization: z.string().optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

// Schema for store settings
const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  gstNumber: z.string().min(15, "GST number must be 15 characters").max(15, "GST number must be 15 characters"),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export default function Settings() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // User form
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "pharmacist",
    },
  });

  // Doctor form
  const doctorForm = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      specialization: "",
      phone: "",
    },
  });

  // Store settings form
  const storeSettingsForm = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: "MediTrack Pharmacy",
      address: "123 Main Street, Delhi, India",
      phone: "9876543210",
      email: "info@meditrack.com",
      gstNumber: "22AAAAA0000A1Z5",
    },
  });

  // Fetch users
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Fetch doctors
  const { data: doctors = [], refetch: refetchDoctors } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: async () => {
      const res = await fetch("/api/doctors", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return res.json();
    },
  });

  // Add new user
  const onSubmitUser = async (data: UserFormValues) => {
    try {
      await apiRequest("POST", "/api/users", data);
      
      toast({
        title: "User added",
        description: "User has been added successfully",
      });
      
      // Refetch users
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      refetchUsers();
      
      // Close dialog and reset form
      setIsAddUserDialogOpen(false);
      userForm.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add user. Please try again.",
      });
    }
  };

  // Add new doctor
  const onSubmitDoctor = async (data: DoctorFormValues) => {
    try {
      await apiRequest("POST", "/api/doctors", data);
      
      toast({
        title: "Doctor added",
        description: "Doctor has been added successfully",
      });
      
      // Refetch doctors
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      refetchDoctors();
      
      // Close dialog and reset form
      setIsAddDoctorDialogOpen(false);
      doctorForm.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add doctor. Please try again.",
      });
    }
  };

  // Save store settings
  const onSaveStoreSettings = async (data: StoreSettingsFormValues) => {
    try {
      // In a real app, this would save to a settings API
      // Simulating success here
      
      toast({
        title: "Settings saved",
        description: "Store settings have been saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    }
  };

  // Delete user
  const handleDeleteUser = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/users/${id}`, undefined);
      
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      refetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again.",
      });
    }
  };

  // Edit user
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    userForm.reset({
      username: user.username,
      password: "", // Don't populate password for security
      name: user.name,
      role: user.role,
    });
    setIsEditUserDialogOpen(true);
  };

  // User table columns
  const userColumns = [
    {
      key: "name",
      header: "Name",
      cell: (row: any) => <div className="font-medium">{row.name}</div>,
    },
    {
      key: "username",
      header: "Username",
      cell: (row: any) => <div>{row.username}</div>,
    },
    {
      key: "role",
      header: "Role",
      cell: (row: any) => (
        <div className="capitalize">
          {row.role === "admin" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              Admin
            </span>
          ) : row.role === "pharmacist" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Pharmacist
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              Accountant
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(row)}
          >
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user
                  account and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteUser(row.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

  // Doctor table columns
  const doctorColumns = [
    {
      key: "name",
      header: "Name",
      cell: (row: any) => <div className="font-medium">Dr. {row.name}</div>,
    },
    {
      key: "specialization",
      header: "Specialization",
      cell: (row: any) => <div>{row.specialization || "-"}</div>,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row: any) => <div>{row.phone}</div>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="doctors">Doctor Management</TabsTrigger>
          <TabsTrigger value="store">Store Settings</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and roles</CardDescription>
              </div>
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={users}
                columns={userColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Doctor Management */}
        <TabsContent value="doctors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Doctors</CardTitle>
                <CardDescription>Manage doctor information</CardDescription>
              </div>
              <Button onClick={() => setIsAddDoctorDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Doctor
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={doctors}
                columns={doctorColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Store Settings */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Update your store details and tax information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...storeSettingsForm}>
                <form onSubmit={storeSettingsForm.handleSubmit(onSaveStoreSettings)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={storeSettingsForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={storeSettingsForm.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={storeSettingsForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={storeSettingsForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={storeSettingsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Settings</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>Configure how your receipts and invoices appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-header">Receipt Header</Label>
                    <Input id="receipt-header" defaultValue="MediTrack Pharmacy" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receipt-footer">Receipt Footer</Label>
                    <Input id="receipt-footer" defaultValue="Thank you for your business!" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="show-gst" defaultChecked />
                  <Label htmlFor="show-gst">Show GST breakdown on receipts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="show-logo" defaultChecked />
                  <Label htmlFor="show-logo">Print logo on receipts</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>Default Printer</Label>
                  <Select defaultValue="receipt">
                    <SelectTrigger>
                      <SelectValue placeholder="Select printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">Receipt Printer (58mm)</SelectItem>
                      <SelectItem value="thermal">Thermal Printer (80mm)</SelectItem>
                      <SelectItem value="a4">A4 Printer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <Printer className="h-4 w-4 mr-2" /> Test Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the appearance of your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="w-full xs:w-auto"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4 mr-2" /> Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="w-full xs:w-auto"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4 mr-2" /> Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="w-full xs:w-auto"
                      onClick={() => setTheme("system")}
                    >
                      <Laptop className="h-4 w-4 mr-2" /> System
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="enable-animations" defaultChecked />
                  <Label htmlFor="enable-animations">Enable animations</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts when products fall below threshold
                    </p>
                  </div>
                  <Switch id="low-stock-alerts" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="expiry-alerts">Expiry Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for products nearing expiry
                    </p>
                  </div>
                  <Switch id="expiry-alerts" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sale-alerts">Sales Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily sales summary
                    </p>
                  </div>
                  <Switch id="sale-alerts" defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <Label>Notification Sound</Label>
                  <Select defaultValue="chime">
                    <SelectTrigger>
                      <SelectValue placeholder="Select sound" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specific role permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-blue-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="pharmacist">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-green-500" />
                            Pharmacist
                          </div>
                        </SelectItem>
                        <SelectItem value="accountant">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 mr-2 text-purple-500" />
                            Accountant
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Add User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account details and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Leave blank to keep current password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-blue-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="pharmacist">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-green-500" />
                            Pharmacist
                          </div>
                        </SelectItem>
                        <SelectItem value="accountant">
                          <div className="flex items-center">
                            <Store className="h-4 w-4 mr-2 text-purple-500" />
                            Accountant
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Doctor Dialog */}
      <Dialog open={isAddDoctorDialogOpen} onOpenChange={setIsAddDoctorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>
              Add a doctor to refer to in prescriptions and bills.
            </DialogDescription>
          </DialogHeader>
          <Form {...doctorForm}>
            <form onSubmit={doctorForm.handleSubmit(onSubmitDoctor)} className="space-y-4">
              <FormField
                control={doctorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter doctor's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={doctorForm.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter specialization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={doctorForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Add Doctor</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
