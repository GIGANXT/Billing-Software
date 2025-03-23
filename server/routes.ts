import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  insertUserSchema,
  insertCategorySchema,
  insertMedicineSchema,
  insertCustomerSchema,
  insertDoctorSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPrescriptionSchema
} from "@shared/schema";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { prescriptionUpload, getAbsoluteFilePath } from "./services/upload";
import { processPrescriptionImage } from "./services/prescription";
import path from "path";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "medicalbilling-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 86400000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user info in session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.name;
      
      // Return user data without password
      const { password: _, ...userData } = user;
      return res.status(200).json(userData);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userData } = user;
      return res.status(200).json(userData);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // In real app, ensure only admins can access this
      if (req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const users = await Promise.all(
        (await storage.getUsers()).map(async (user) => {
          const { password, ...userData } = user;
          return userData;
        })
      );
      
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      // In real app, ensure only admins can create users
      if (req.session.userRole !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      const { password, ...userData } = user;
      return res.status(201).json(userData);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Medicine routes
  app.get("/api/medicines", async (req, res) => {
    try {
      const medicines = await storage.getMedicines();
      return res.status(200).json(medicines);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/medicines/low-stock", isAuthenticated, async (req, res) => {
    try {
      const lowStockMedicines = await storage.getLowStockMedicines();
      return res.status(200).json(lowStockMedicines);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/medicines/expiring", isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const expiringMedicines = await storage.getExpiringMedicines(days);
      return res.status(200).json(expiringMedicines);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/medicines", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(validatedData);
      return res.status(201).json(medicine);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/medicines/:id/stock", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stock } = req.body;
      
      if (isNaN(id) || typeof stock !== "number") {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      const medicine = await storage.updateMedicineStock(id, stock);
      
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      
      return res.status(200).json(medicine);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      return res.status(200).json(customers);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      return res.status(200).json(customer);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/customers/phone/:phone", isAuthenticated, async (req, res) => {
    try {
      const { phone } = req.params;
      const customer = await storage.getCustomerByPhone(phone);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      return res.status(200).json(customer);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      return res.status(201).json(customer);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", isAuthenticated, async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      return res.status(200).json(doctors);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/doctors", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDoctorSchema.parse(req.body);
      const doctor = await storage.createDoctor(validatedData);
      return res.status(201).json(doctor);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      return res.status(200).json(invoices);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const items = await storage.getInvoiceItems(id);
      
      return res.status(200).json({ invoice, items });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/customers/:id/invoices", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const invoices = await storage.getCustomerInvoices(id);
      return res.status(200).json(invoices);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const { invoice, items } = req.body;
      
      if (!invoice || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid invoice data" });
      }
      
      // Generate a unique invoice number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      invoice.invoiceNumber = `INV-${dateStr}-${randomStr}`;
      
      // Set the user ID from the session
      invoice.userId = req.session.userId;
      
      const validatedInvoice = insertInvoiceSchema.parse(invoice);
      const createdInvoice = await storage.createInvoice(validatedInvoice);
      
      // Create invoice items
      const createdItems = [];
      for (const item of items) {
        item.invoiceId = createdInvoice.id;
        const validatedItem = insertInvoiceItemSchema.parse(item);
        createdItems.push(await storage.createInvoiceItem(validatedItem));
        
        // Update medicine stock
        const medicine = await storage.getMedicine(item.medicineId);
        if (medicine) {
          const newStock = medicine.stock - item.quantity;
          await storage.updateMedicineStock(medicine.id, newStock);
        }
      }
      
      return res.status(201).json({ invoice: createdInvoice, items: createdItems });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Prescription routes
  app.get("/api/customers/:id/prescriptions", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const prescriptions = await storage.getPrescriptions(id);
      return res.status(200).json(prescriptions);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/prescriptions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      return res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/top-selling", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const topSellingMedicines = await storage.getTopSellingMedicines(limit);
      return res.status(200).json(topSellingMedicines);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/analytics/daily-sales", isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const dailySales = await storage.getDailySales(days);
      return res.status(200).json(dailySales);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
