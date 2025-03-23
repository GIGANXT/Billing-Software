import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { CartItem, Customer } from "@/components/pos/cart";

interface Medicine {
  id: number;
  name: string;
  mrp: string;
  gstRate: string;
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
  try {
    const doc = new jsPDF();

    // Add company information at the top
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Primary blue color
    doc.text("MediTrack", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Medical Billing System", 14, 25);
    doc.text("123 Main Street, Delhi, India", 14, 30);
    doc.text("Phone: +91 98765 43210", 14, 35);
    doc.text("Email: info@meditrack.com", 14, 40);
    doc.text("GST Number: 22AAAAA0000A1Z5", 14, 45);

    // Add invoice details
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
    doc.text(invoiceData.customer?.name || "Walk-in Customer", 14, 65);
    doc.text(invoiceData.customer?.phone || "", 14, 70);

    if (invoiceData.doctorName) {
      doc.text(`Doctor: ${invoiceData.doctorName}`, 14, 75);
    }

    // Add items table
    const tableData = invoiceData.items.map(item => [
      item.medicine.name,
      item.quantity.toString(),
      `₹${item.unitPrice.toFixed(2)}`,
      `${item.gstRate}%`,
      `₹${item.gstAmount.toFixed(2)}`,
      `₹${item.totalPrice.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: 85,
      head: [["Item", "Qty", "Unit Price", "GST", "GST Amt", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Add totals
    doc.setFontSize(10);
    doc.text("Subtotal:", 130, finalY + 10);
    doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 175, finalY + 10, { align: "right" });
    doc.text("GST Amount:", 130, finalY + 20);
    doc.text(`₹${invoiceData.gstAmount.toFixed(2)}`, 175, finalY + 20, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 130, finalY + 30);
    doc.text(`₹${invoiceData.total.toFixed(2)}`, 175, finalY + 30, { align: "right" });

    // Add footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Terms & Conditions:", 14, finalY + 40);
    doc.text("1. Medicines once sold will not be taken back or exchanged.", 14, finalY + 45);
    doc.text("2. This is a computer-generated invoice.", 14, finalY + 50);
    doc.text("Thank you for your business!", 105, finalY + 60, { align: "center" });
    doc.text(`Served by: ${invoiceData.userInfo.name}`, 105, finalY + 65, { align: "center" });

    // Save the PDF
    doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate invoice PDF. " + (error as Error).message);
  }
}