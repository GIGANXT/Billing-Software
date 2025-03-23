import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Extend jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Medicine {
  id: number;
  name: string;
  mrp: string;
  gstRate: string;
}

interface CartItem {
  medicineId: number;
  medicine: Medicine;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  customer: Customer | null;
  doctorName?: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  userInfo: {
    name: string;
  };
}

export function generateInvoicePDF(invoiceData: InvoiceData): void {
  const doc = new jsPDF();
  
  // Add company information at the top
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Primary blue color
  doc.text("MediTrack", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Medical Billing System", 14, 25);
  
  doc.setFontSize(10);
  doc.text("123 Main Street, Delhi, India", 14, 30);
  doc.text("Phone: +91 98765 43210", 14, 35);
  doc.text("Email: info@meditrack.com", 14, 40);
  doc.text("GST Number: 22AAAAA0000A1Z5", 14, 45);
  
  // Add invoice title and number
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("TAX INVOICE", 150, 20, { align: "right" });
  
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 150, 30, { align: "right" });
  doc.text(`Date: ${format(invoiceData.date, "dd/MM/yyyy")}`, 150, 35, { align: "right" });
  doc.text(`Time: ${format(invoiceData.date, "hh:mm a")}`, 150, 40, { align: "right" });
  
  // Add customer information
  doc.setFontSize(12);
  doc.text("Bill To:", 14, 60);
  
  doc.setFontSize(10);
  if (invoiceData.customer) {
    doc.text(`Name: ${invoiceData.customer.name}`, 14, 65);
    doc.text(`Phone: ${invoiceData.customer.phone}`, 14, 70);
    if (invoiceData.customer.address) {
      doc.text(`Address: ${invoiceData.customer.address}`, 14, 75);
    }
  } else {
    doc.text("Walk-in Customer", 14, 65);
  }
  
  // Add doctor information if available
  if (invoiceData.doctorName) {
    doc.text(`Prescribed by: Dr. ${invoiceData.doctorName}`, 150, 65, { align: "right" });
  }
  
  // Add items table
  const tableColumn = ["#", "Item", "Qty", "Rate", "GST%", "GST Amt", "Total"];
  const tableRows = invoiceData.items.map((item, index) => [
    (index + 1).toString(),
    item.medicine.name,
    item.quantity.toString(),
    `₹${item.unitPrice.toFixed(2)}`,
    `${item.gstRate}%`,
    `₹${item.gstAmount.toFixed(2)}`,
    `₹${item.totalPrice.toFixed(2)}`
  ]);
  
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 85,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
    },
  });
  
  // Add total calculations
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text("Subtotal:", 130, finalY);
  doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 175, finalY, { align: "right" });
  
  doc.text("GST Amount:", 130, finalY + 5);
  doc.text(`₹${invoiceData.gstAmount.toFixed(2)}`, 175, finalY + 5, { align: "right" });
  
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Grand Total:", 130, finalY + 15);
  doc.text(`₹${invoiceData.total.toFixed(2)}`, 175, finalY + 15, { align: "right" });
  doc.setFont(undefined, "normal");
  
  // Add terms and conditions
  doc.setFontSize(9);
  doc.text("Terms & Conditions:", 14, finalY + 25);
  doc.setFontSize(8);
  doc.text("1. Medicines once sold will not be taken back or exchanged.", 14, finalY + 30);
  doc.text("2. This is a computer-generated invoice and does not require a signature.", 14, finalY + 35);
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your business!", 105, finalY + 45, { align: "center" });
  doc.text(`Served by: ${invoiceData.userInfo.name}`, 105, finalY + 50, { align: "center" });
  
  // Save the PDF
  doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);
}
