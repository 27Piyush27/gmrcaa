/**
 * GMR & Associates — Professional Invoice PDF Generator
 * Uses jsPDF to produce a legally-styled, printable invoice.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";






















// ── Colour / font constants ────────────────────────────────────────────────────
const BRAND_BLACK = [10, 10, 10];
const BRAND_GRAY = [90, 90, 90];
const LIGHT_GRAY = [240, 240, 240];
const WHITE = [255, 255, 255];
const GREEN = [22, 163, 74];

// ─────────────────────────────────────────────────────────────────────────────

export function generateInvoicePDF(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();

  let y = 0;

  // ── 1. Header band ─────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_BLACK);
  doc.rect(0, 0, W, 42, "F");

  // Firm name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text("GMR & Associates", 14, 18);

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("Chartered Accountants  ·  Since 2011", 14, 25);

  // "TAX INVOICE" label on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text("TAX INVOICE", W - 14, 18, { align: "right" });

  // Invoice number & date (right-aligned, smaller)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`${data.invoiceNumber}`, W - 14, 26, { align: "right" });
  doc.text(data.date, W - 14, 31, { align: "right" });

  y = 52;

  // ── 2. Two columns: From | Bill To ────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_GRAY);
  doc.text("FROM", 14, y);
  doc.text("BILLED TO", W / 2 + 4, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLACK);
  doc.text("GMR & Associates", 14, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLACK);
  doc.text(data.clientName, W / 2 + 4, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_GRAY);
  doc.text("support@gmrassociates.com", 14, y);
  doc.text(data.clientEmail, W / 2 + 4, y);

  y += 4.5;
  doc.text("+91 98765 43210", 14, y);
  if (data.clientPhone) {
    doc.text(data.clientPhone, W / 2 + 4, y);
  }

  y += 4.5;
  doc.text("Mumbai, Maharashtra, India", 14, y);

  // GSTIN placeholder
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND_BLACK);
  doc.text("GSTIN: 27AAAAA0000A1Z5", 14, y);

  // ── 3. Thin divider ────────────────────────────────────────────────────────
  y += 10;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.4);
  doc.line(14, y, W - 14, y);
  y += 8;

  // ── 4. Service table ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_BLACK);
  doc.text("Service Details", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["#", "Description", "HSN / SAC", "Amount (₹)"]],
    body: [
    [
    "01",
    data.serviceTitle + (data.serviceDescription ? `\n${data.serviceDescription}` : ""),
    "998312", // SAC for accounting & bookkeeping-type services
    `₹${data.baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`]],


    headStyles: {
      fillColor: [10, 10, 10],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 38, halign: "right" }
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: "grid"
  });

  
  y = doc.lastAutoTable.finalY + 6;

  // ── 5. Summary box (right-aligned) ────────────────────────────────────────
  const boxX = W - 14 - 72;
  const boxW = 72;

  const summaryRows = [
  ["Sub-total", `₹${data.baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
  ["CGST @ 9%", `₹${(data.gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
  ["SGST @ 9%", `₹${(data.gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`]];


  // Draw rows
  doc.setFontSize(9);
  let rowY = y;
  summaryRows.forEach(([label, value]) => {
    doc.setTextColor(...BRAND_GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(label, boxX, rowY);
    doc.setTextColor(...BRAND_BLACK);
    doc.text(value, boxX + boxW, rowY, { align: "right" });
    rowY += 5.5;
  });

  // Total band
  rowY += 1;
  doc.setFillColor(...BRAND_BLACK);
  doc.roundedRect(boxX - 4, rowY - 5, boxW + 8, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text("TOTAL", boxX, rowY + 1.5);
  doc.text(
    `₹${data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    boxX + boxW,
    rowY + 1.5,
    { align: "right" }
  );

  y = rowY + 16;

  // ── 6. Payment info ────────────────────────────────────────────────────────
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.4);
  doc.line(14, y, W - 14, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_BLACK);
  doc.text("Payment Information", 14, y);
  y += 5.5;

  const payInfoRows = [
  ["Status:", "PAID  ✓"],
  ["Payment ID:", data.paymentId],
  ["Order ID:", data.orderId],
  ["Payment Gateway:", "Razorpay (UPI / Card / Net Banking)"],
  ["Payment Date:", data.date]];


  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  payInfoRows.forEach(([label, value]) => {
    doc.setTextColor(...BRAND_GRAY);
    doc.text(label, 14, y);

    // Colour "PAID ✓" green
    if (label === "Status:") {
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(...BRAND_BLACK);
      doc.setFont("helvetica", "normal");
    }
    doc.text(value, 55, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  });

  // ── 7. Amount in words ────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(14, y, W - 14, y);
  y += 6;

  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, y - 3, W - 28, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND_GRAY);
  doc.text("Amount in Words:", 18, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND_BLACK);
  doc.text(numberToWords(data.totalAmount) + " Rupees Only", 55, y + 3);

  // ── 8. Notes / T&C ────────────────────────────────────────────────────────
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_GRAY);
  doc.text("Notes:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    "1. This is a system-generated invoice and does not require a physical signature.",
    22,
    y
  );
  y += 4.5;
  doc.text("2. GST (18%) includes CGST @ 9% and SGST @ 9% as applicable.", 22, y);
  y += 4.5;
  doc.text("3. For queries, contact: support@gmrassociates.com | +91 98765 43210", 22, y);

  // ── 9. Footer band ────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BRAND_BLACK);
  doc.rect(0, pageH - 14, W, 14, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("GMR & Associates  ·  Chartered Accountants  ·  Mumbai, India", W / 2, pageH - 5.5, {
    align: "center"
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`${data.invoiceNumber}.pdf`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a number to English words (supports up to crores) */
function numberToWords(num) {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function words(n) {
    if (n === 0) return "";
    if (n < 20) return units[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + units[n % 10] + " ";
    if (n < 1000) return units[Math.floor(n / 100)] + " Hundred " + words(n % 100);
    if (n < 100000) return words(Math.floor(n / 1000)) + "Thousand " + words(n % 1000);
    if (n < 10000000) return words(Math.floor(n / 100000)) + "Lakh " + words(n % 100000);
    return words(Math.floor(n / 10000000)) + "Crore " + words(n % 10000000);
  }

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  let result = words(intPart).trim() || "Zero";
  if (decPart > 0) result += ` and ${words(decPart).trim()} Paise`;
  return result;
}

/** Generate a sequential invoice number */
export function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${year}${month}${day}-${rand}`;
}