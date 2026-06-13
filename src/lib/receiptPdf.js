"use client";

import { jsPDF } from "jspdf";

const COMPANY_NAME = "HO-Divinecarat Lifestyles Private Limited";
const COMPANY_ADDRESS = "Office 1402-2, Dlh Park, 14th Floor,";

const safe = (value, fallback = "-") =>
  value === null || value === undefined || value === "" ? fallback : String(value);

const amountNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatAmount = (value) =>
  amountNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safe(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
};

const numberWords = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tensWords = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function toWordsBelowThousand(num) {
  let text = "";
  const hundred = Math.floor(num / 100);
  const rest = num % 100;

  if (hundred) {
    text += `${numberWords[hundred]} Hundred`;
    if (rest) text += " ";
  }

  if (rest < 20) {
    if (rest) text += numberWords[rest];
  } else {
    const tens = Math.floor(rest / 10);
    const units = rest % 10;
    text += tensWords[tens];
    if (units) text += ` ${numberWords[units]}`;
  }

  return text.trim();
}

function amountToWords(value) {
  let num = Math.floor(amountNumber(value));
  if (!num) return "Rupees Zero Only.";

  const parts = [];
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundredPart = num;

  if (crore) parts.push(`${toWordsBelowThousand(crore)} Crore`);
  if (lakh) parts.push(`${toWordsBelowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${toWordsBelowThousand(thousand)} Thousand`);
  if (hundredPart) parts.push(toWordsBelowThousand(hundredPart));

  return `Rupees ${parts.join(" ")} Only.`;
}

function pickReceiptEntity(response) {
  if (response?.Entity) return response.Entity;
  if (response?.entity) return response.entity;
  if (response?.Entities?.[0]) return response.Entities[0];
  if (response?.Data?.Entity) return response.Data.Entity;
  if (response?.Data?.Entities?.[0]) return response.Data.Entities[0];
  return response || {};
}

/**
 * Loads the logo JPEG from the public folder and converts it to a data URI
 * that jsPDF can use via addImage.
 */
async function loadLogoDataUri() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/images/color-logo.jpeg";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };

    img.onerror = () => {
      console.error("Failed to load logo from /images/color-logo.jpeg");
      resolve(null);
    };
  });
}

export async function downloadReceiptPdf(receiptResponse) {
  const receipt = pickReceiptEntity(receiptResponse);
  const paymentDetail = receipt.scheme_receipt_details?.[0] || {};
  const amount = receipt.amount || paymentDetail.amount || 0;
  const receiptNo = receipt.document_no || receipt.receipt_no || receipt.EntityId || receipt.entity_id;
  const receivedFrom = receipt.party_name || receipt.customer_name || "-";
  const modeName = paymentDetail.mode_name || paymentDetail.mode_id || "-";
  const refNo = paymentDetail.ref_no || paymentDetail.code || "-";

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 10;

  // Add Logo at the top center
  const logoDataUri = await loadLogoDataUri();
  if (logoDataUri) {
    // 1mm = 3.7795 px. So 53px = 14mm, 100px = 26.45mm
    const logoWidth = 14; 
    const logoHeight = 26.45;
    doc.addImage(logoDataUri, "JPEG", (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight);
    y += logoHeight + 8; // Increased margin below logo to approx 30px
  }

  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text("SCHEME RECEIPT", pageWidth / 2, y, { align: "center" });

  y += 9;
  doc.setFontSize(11);
  doc.text(COMPANY_NAME, 14, y);
  y += 6;
  doc.setFont("times", "normal");
  doc.text(COMPANY_ADDRESS, 14, y);

  y += 12;
  doc.setFont("times", "bold");
  doc.text(`Date :- ${formatDate(receipt.document_date || receipt.receipt_date)}`, 14, y);
  doc.text(`Receipt No :- ${safe(receiptNo)}`, 118, y);

  y += 10;
  doc.text(`Received From :- ${safe(receivedFrom)}`, 14, y);
  doc.text(`Amount :- ${formatAmount(amount)}`, 118, y);

  y += 12;
  doc.setLineWidth(0.25);
  doc.rect(14, y, pageWidth - 28, 18);
  doc.line(58, y, 58, y + 18);
  doc.line(104, y, 104, y + 18);

  doc.setFont("times", "bold");
  doc.text("Mode", 18, y + 6);
  doc.text("Amount", 67, y + 6);
  doc.text("Ref No", 112, y + 6);

  doc.setFont("times", "normal");
  doc.text(safe(modeName), 18, y + 14);
  doc.text(formatAmount(amount), 67, y + 14);
  doc.text(safe(refNo), 112, y + 14);

  y += 28;
  doc.setFont("times", "bold");
  doc.text("Reciept Modes", 14, y);

  y += 10;
  doc.setFont("times", "normal");
  doc.text(`Amount in Words :- ${amountToWords(amount)}`, 14, y, {
    maxWidth: pageWidth - 28,
  });

  y += 18;
  doc.setFont("times", "italic");
  doc.text("this is online receipt", 14, y);

  const fileName = `scheme-receipt-${safe(receiptNo, "download")}.pdf`;
  doc.save(fileName);
}
