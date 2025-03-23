import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("pharmacist"), // admin, pharmacist, accountant
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Medicines table
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category_id: integer("category_id").notNull(),
  form: text("form").notNull(), // tablet, capsule, syrup, etc.
  batchNumber: text("batch_number").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  mrp: numeric("mrp").notNull(),
  stock: integer("stock").notNull(),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  gstRate: numeric("gst_rate").notNull().default("18"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id"),
  doctorId: integer("doctor_id"),
  subtotal: numeric("subtotal").notNull(),
  gstAmount: numeric("gst_amount").notNull(),
  total: numeric("total").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoice items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  medicineId: integer("medicine_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  gstRate: numeric("gst_rate").notNull(),
  gstAmount: numeric("gst_amount").notNull(),
  totalPrice: numeric("total_price").notNull(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  doctorId: integer("doctor_id"),
  prescriptionImagePath: text("prescription_image_path"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Schema for inserting categories
export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

// Schema for inserting medicines
export const insertMedicineSchema = createInsertSchema(medicines).pick({
  name: true,
  description: true,
  category_id: true,
  form: true,
  batchNumber: true,
  expiryDate: true,
  mrp: true,
  stock: true,
  lowStockThreshold: true,
  gstRate: true,
});

// Schema for inserting customers
export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  phone: true,
  email: true,
  address: true,
});

// Schema for inserting doctors
export const insertDoctorSchema = createInsertSchema(doctors).pick({
  name: true,
  specialization: true,
  phone: true,
});

// Schema for inserting invoices
export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  customerId: true,
  doctorId: true,
  subtotal: true,
  gstAmount: true,
  total: true,
  userId: true,
});

// Schema for inserting invoice items
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).pick({
  invoiceId: true,
  medicineId: true,
  quantity: true,
  unitPrice: true,
  gstRate: true,
  gstAmount: true,
  totalPrice: true,
});

// Schema for inserting prescriptions
export const insertPrescriptionSchema = createInsertSchema(prescriptions).pick({
  customerId: true,
  doctorId: true,
  prescriptionImagePath: true,
  notes: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicines.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
