import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodePaymentUid, encodePaymentUid } from "@/lib/saasInvoice";
import fs from "fs";
import path from "path";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function numberToWords(num) {
  if (!num || isNaN(num) || num === 0) return "Zero Rupees";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function g(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "");
  }

  function h(n) {
    if (n >= 100) {
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + g(n % 100) : "");
    }
    return g(n);
  }

  let str = "";
  let temp = Math.floor(num);
  if (temp >= 10000000) {
    str += h(Math.floor(temp / 10000000)) + " Crore ";
    temp %= 10000000;
  }
  if (temp >= 100000) {
    str += h(Math.floor(temp / 100000)) + " Lakh ";
    temp %= 100000;
  }
  if (temp >= 1000) {
    str += h(Math.floor(temp / 1000)) + " Thousand ";
    temp %= 1000;
  }
  if (temp > 0) {
    str += h(temp);
  }
  return str.trim() + " Rupees Only";
}

export async function GET(req, { params }) {
  try {
    const { paymentId } = await params;
    const pId = decodePaymentUid(paymentId);

    if (!pId) {
      return new Response("Invalid or expired invoice UID link. Direct numeric IDs are not permitted.", { status: 404 });
    }

    const payment = await prisma.workspacePayment.findUnique({
      where: { id: pId },
      include: {
        workspace: {
          include: {
            admins: {
              where: { roleId: 1 },
              include: {
                address: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return new Response("Subscription payment record not found", { status: 404 });
    }

    // ── Load Logo Base64 ──
    let logoDataUrl = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "logo", "logobg.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Failed to read logo image:", err);
    }

    const primaryAdmin = payment.workspace?.admins?.[0] || null;
    const adminAddress = primaryAdmin?.address || null;
    const addressLine = [
      adminAddress?.address1,
      adminAddress?.address2,
      adminAddress?.city,
      adminAddress?.state,
      adminAddress?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    const invoiceNo = `INV-SAAS-${String(payment.id).padStart(6, "0")}`;
    const invoiceDateStr = formatDate(payment.paidAt);
    const amountNum = Number(payment.amount) || 0;
    const amountInWords = numberToWords(amountNum);
    const serviceStartDateStr = formatDate(payment.startAt || payment.paidAt);
    const serviceEndDateStr = formatDate(payment.expireAt);

    // Parse MRP & Discount details
    let originalPrice = amountNum;
    let discountAmount = 0;
    let cleanNotes = (payment.notes || "").trim();

    const discountMatch = cleanNotes.match(/\[MRP:₹?([\d.]+)\|DISC:₹?([\d.]+)\]/);
    if (discountMatch) {
      originalPrice = parseFloat(discountMatch[1]) || amountNum;
      discountAmount = parseFloat(discountMatch[2]) || 0;
      cleanNotes = cleanNotes.replace(/\s*\[MRP:.*?\]/, "").trim();
    } else {
      // Standard Tier MRP fallback
      const standardRate =
        payment.days <= 30
          ? 499
          : payment.days <= 60
            ? 999
            : payment.days <= 90
              ? 1499
              : payment.days <= 180
                ? 2999
                : payment.days <= 365
                  ? 5999
                  : Math.round((payment.days / 30) * 499);
      if (standardRate > amountNum && amountNum > 0) {
        originalPrice = standardRate;
        discountAmount = standardRate - amountNum;
      } else {
        originalPrice = amountNum;
        discountAmount = 0;
      }
    }

    const discountPercent =
      originalPrice > 0 && discountAmount > 0
        ? Math.round((discountAmount / originalPrice) * 100)
        : 0;

    // Verification QR Code with UID
    const paymentUid = encodePaymentUid(payment.id);
    const invoiceVerificationUrl = `${req.nextUrl.origin}/api/print-subscription-invoice/${paymentUid}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      invoiceVerificationUrl
    )}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Subscription Invoice - ${invoiceNo} - ${payment.workspace?.name || "Workspace"}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #1e293b;
              background-color: #f1f5f9;
              font-size: 13px;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print-bar {
              background: #0f172a;
              color: white;
              padding: 12px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              position: sticky;
              top: 0;
              z-index: 100;
            }
            .btn-action {
              background: #2563eb;
              color: white;
              border: none;
              padding: 8px 18px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              transition: all 0.2s;
              text-decoration: none;
            }
            .btn-action:hover { background: #1d4ed8; }
            .btn-close {
              background: #334155;
              color: #cbd5e1;
              border: 1px solid #475569;
              padding: 8px 14px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
            }
            .btn-close:hover { background: #475569; color: white; }

            .invoice-wrapper {
              max-width: 820px;
              margin: 28px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
              padding: 44px 48px;
              border: 1px solid #e2e8f0;
              position: relative;
            }

            /* Header Section */
            .header-grid {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 24px;
              border-bottom: 2px solid #e2e8f0;
            }
            .logo-box img {
              height: 52px;
              object-fit: contain;
              display: block;
              margin-bottom: 8px;
            }
            .company-name {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.3px;
            }
            .company-tagline {
              font-size: 11.5px;
              color: #64748b;
              font-weight: 500;
              margin-top: 2px;
            }
            .company-contact {
              font-size: 11px;
              color: #475569;
              margin-top: 6px;
              line-height: 1.4;
            }

            .invoice-meta {
              text-align: right;
            }
            .invoice-title {
              font-size: 22px;
              font-weight: 900;
              color: #1e1b4b;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .invoice-badge {
              display: inline-block;
              background: #dcfce7;
              color: #15803d;
              font-size: 11px;
              font-weight: 800;
              padding: 3px 10px;
              border-radius: 12px;
              margin-top: 4px;
              letter-spacing: 0.5px;
              border: 1px solid #bbf7d0;
            }
            .meta-list {
              margin-top: 10px;
              font-size: 12px;
            }
            .meta-row {
              display: flex;
              justify-content: flex-end;
              gap: 8px;
              margin-bottom: 3px;
            }
            .meta-label {
              color: #64748b;
              font-weight: 600;
            }
            .meta-val {
              font-weight: 700;
              color: #0f172a;
            }

            /* Two Column Cards */
            .details-cards {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 24px 0;
            }
            .card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 18px;
            }
            .card-title {
              font-size: 11px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .client-name {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 3px;
            }
            .client-slug {
              display: inline-block;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              color: #6366f1;
              background: #eef2ff;
              padding: 1px 6px;
              border-radius: 4px;
              margin-bottom: 6px;
              font-weight: 700;
            }
            .client-info {
              font-size: 12px;
              color: #334155;
              line-height: 1.5;
            }

            /* Line Items Table */
            .table-box {
              margin: 24px 0;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              border-radius: 8px;
              overflow: hidden;
            }
            .invoice-table th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 800;
              font-size: 11.5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 12px 14px;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              text-align: left;
            }
            .invoice-table td {
              padding: 14px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
              text-align: left;
            }
            .item-title {
              font-weight: 700;
              font-size: 13.5px;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .item-desc {
              font-size: 11.5px;
              color: #64748b;
              line-height: 1.4;
            }
            .item-tag {
              display: inline-block;
              font-size: 10.5px;
              background: #f1f5f9;
              color: #475569;
              padding: 2px 6px;
              border-radius: 4px;
              margin-top: 4px;
              font-weight: 600;
            }
            .duration-badge {
              display: inline-block;
              background: #ecfdf5;
              color: #047857;
              font-weight: 800;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11.5px;
              border: 1px solid #a7f3d0;
            }

            /* Financial Summary */
            .summary-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 16px;
              gap: 20px;
            }
            .words-box {
              flex: 1;
              background: #f8fafc;
              border-left: 3px solid #6366f1;
              padding: 12px 16px;
              border-radius: 0 6px 6px 0;
            }
            .words-label {
              font-size: 10.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .words-val {
              font-size: 12.5px;
              font-weight: 700;
              color: #1e293b;
            }

            .totals-box {
              width: 280px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 12.5px;
            }
            .total-row.grand-total {
              border-top: 2px solid #0f172a;
              margin-top: 6px;
              padding-top: 10px;
              font-size: 16px;
              font-weight: 900;
              color: #0f172a;
            }

            /* QR & Signatures */
            .footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 36px;
              padding-top: 24px;
              border-top: 1px dashed #cbd5e1;
            }
            .qr-block {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .qr-block img {
              width: 74px;
              height: 74px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 2px;
            }
            .qr-text {
              font-size: 11px;
              color: #64748b;
              line-height: 1.4;
            }
            .qr-text strong {
              color: #0f172a;
              display: block;
              margin-bottom: 2px;
            }

            .signature-box {
              text-align: right;
            }
            .signature-seal {
              display: inline-block;
              border: 2px solid #6366f1;
              color: #4f46e5;
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            .signatory-title {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
            }
            .signatory-sub {
              font-size: 10px;
              color: #64748b;
            }

            /* Terms */
            .terms-box {
              margin-top: 28px;
              padding-top: 14px;
              border-top: 1px solid #f1f5f9;
              font-size: 10.5px;
              color: #94a3b8;
              line-height: 1.5;
            }

            /* Responsive Styles for Mobile & Tablets */
            @media screen and (max-width: 768px) {
              body {
                background-color: #f8fafc;
              }
              .no-print-bar {
                display: none !important;
              }
              .invoice-wrapper {
                margin: 12px auto 24px auto;
                padding: 24px 18px;
                border-radius: 12px;
                width: calc(100% - 24px);
                max-width: 100%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
              }
              .header-grid {
                flex-direction: column;
                gap: 20px;
                align-items: flex-start;
                padding-bottom: 20px;
              }
              .invoice-meta {
                text-align: left;
                width: 100%;
                border-top: 1px dashed #e2e8f0;
                padding-top: 16px;
              }
              .meta-row {
                justify-content: space-between;
              }
              .details-cards {
                grid-template-columns: 1fr;
                gap: 12px;
                margin: 16px 0;
              }
              .table-box {
                margin: 16px 0;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
              }
              .invoice-table {
                min-width: 480px;
              }
              .invoice-table th, .invoice-table td {
                padding: 10px 8px;
              }
              .summary-container {
                flex-direction: column-reverse;
                gap: 16px;
              }
              .totals-box {
                width: 100%;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px 16px;
              }
              .words-box {
                width: 100%;
              }
              .footer-section {
                flex-direction: column;
                align-items: flex-start;
                gap: 20px;
                margin-top: 24px;
                padding-top: 18px;
              }
              .signature-box {
                text-align: left;
                width: 100%;
                border-top: 1px dashed #e2e8f0;
                padding-top: 16px;
              }
            }

            @media screen and (max-width: 480px) {
              .invoice-wrapper {
                margin: 8px auto 16px auto;
                padding: 18px 14px;
                width: calc(100% - 16px);
              }
              .company-name {
                font-size: 16px;
              }
              .invoice-title {
                font-size: 19px;
              }
            }

            @media print {
              body { background: white; }
              .no-print-bar { display: none !important; }
              .invoice-wrapper {
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                max-width: 100% !important;
                width: 100% !important;
              }
              .header-grid {
                flex-direction: row !important;
              }
              .invoice-meta {
                text-align: right !important;
                border-top: none !important;
                padding-top: 0 !important;
                width: auto !important;
              }
              .meta-row {
                justify-content: flex-end !important;
              }
              .details-cards {
                grid-template-columns: 1fr 1fr !important;
              }
              .summary-container {
                flex-direction: row !important;
              }
              .totals-box {
                width: 280px !important;
                background: none !important;
                border: none !important;
                padding: 0 !important;
              }
              .footer-section {
                flex-direction: row !important;
                align-items: flex-end !important;
              }
              .signature-box {
                text-align: right !important;
                border-top: none !important;
                padding-top: 0 !important;
                width: auto !important;
              }
              @page {
                size: A4;
                margin: 12mm 14mm;
              }
            }
          </style>
        </head>
        <body>
          <!-- Top Action Bar for interactive browser view -->
          <div class="no-print-bar">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 800; font-size: 14px; color: #38bdf8;">EasyTechnoMed SaaS Billing</span>
              <span style="color: #64748b;">•</span>
              <span style="font-size: 12px; color: #94a3b8;">Official Subscription Tax Invoice / Receipt</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn-action" onclick="window.print()">
                🖨️ Print / Save as PDF
              </button>
              <button class="btn-close" onclick="window.close()">
                Close Window
              </button>
            </div>
          </div>

          <div class="invoice-wrapper">
            <!-- Header Section -->
            <div class="header-grid">
              <div class="logo-box">
                ${logoDataUrl
        ? `<img src="${logoDataUrl}" alt="EasyTechnoMed Logo" />`
        : `<div style="font-size: 20px; font-weight: 900; color: #0f766e;">EasyTechnoMed</div>`
      }
                <div class="company-name">EasyTechnoMed</div>
                <div class="company-tagline">Cloud Laboratory Information & Diagnostic Management System</div>
                <div class="company-contact">
                  <strong>Support:</strong> support@easytechnomed.com<br />
                  <strong>Web:</strong> https://easytechnomed.com
                </div>
              </div>

              <div class="invoice-meta">
                <div class="invoice-title">Tax Invoice</div>
                <div class="invoice-badge">✓ PAID & VERIFIED</div>
                <div class="meta-list">
                  <div class="meta-row">
                    <span class="meta-label">Invoice No:</span>
                    <span class="meta-val" style="font-family: 'JetBrains Mono', monospace;">${invoiceNo}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Invoice Date:</span>
                    <span class="meta-val">${invoiceDateStr}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Payment Mode:</span>
                    <span class="meta-val">${payment.paymentMode || "UPI"}</span>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Ref / UTR:</span>
                    <span class="meta-val" style="font-family: 'JetBrains Mono', monospace;">${payment.referenceNo || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Two Details Cards -->
            <div class="details-cards">
              <div class="card">
                <div class="card-title">🏢 Billed To (Subscriber Lab)</div>
                <div class="client-name">${payment.workspace?.name || "Laboratory Workspace"}</div>
                <div class="client-info">
                  ${primaryAdmin?.name ? `<strong>Contact Person:</strong> ${primaryAdmin.name}<br />` : ""}
                  ${primaryAdmin?.email ? `<strong>Email:</strong> ${primaryAdmin.email}<br />` : ""}
                  ${primaryAdmin?.mobileNumber ? `<strong>Phone:</strong> ${primaryAdmin.mobileNumber}<br />` : ""}
                  ${addressLine ? `<strong>Address:</strong> ${addressLine}` : ""}
                </div>
              </div>

              <div class="card">
                <div class="card-title">📅 Subscription Plan Details</div>
                <div style="margin-bottom: 6px;">
                  <span style="color: #64748b; font-size: 11.5px; font-weight: 600;">Plan Extension:</span>
                  <strong style="color: #166534; font-size: 13px;"> +${payment.days} Days Active License</strong>
                </div>
                <div style="margin-bottom: 6px;">
                  <span style="color: #64748b; font-size: 11.5px; font-weight: 600;">Subscription Period:</span><br />
                  <strong style="color: #0f172a; font-size: 12px;">${serviceStartDateStr} &nbsp;→&nbsp; ${serviceEndDateStr}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 11.5px; font-weight: 600;">Payment Timestamp:</span><br />
                  <span style="color: #334155; font-size: 11.5px;">${formatDateTime(payment.paidAt)}</span>
                </div>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="table-box">
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th style="text-align: left;">Service & License Description</th>
                    <th style="width: 120px; text-align: center;">Validity</th>
                    <th style="width: 130px; text-align: right;">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="text-align: center; font-weight: 700; color: #64748b;">1</td>
                    <td style="text-align: left;">
                      <div class="item-title">EasyTechnoMed SaaS Subscription (${payment.days} Days)</div>
                      <div class="item-desc">
                        Cloud diagnostic software & lab management system license.
                      </div>
                      ${cleanNotes && cleanNotes !== "—"
        ? `<div class="item-tag" style="margin-top: 5px;">Note: ${cleanNotes}</div>`
        : ""
      }
                    </td>
                    <td style="text-align: center;">
                      <span class="duration-badge">+${payment.days} Days</span>
                      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Until ${serviceEndDateStr}</div>
                    </td>
                    <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">
                      ${discountAmount > 0
        ? `<div style="text-decoration: line-through; color: #94a3b8; font-size: 11px; font-weight: 600;">₹${originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>`
        : ""
      }
                      <div style="font-weight: 800; font-size: 14px; color: #0f172a;">
                        ₹${amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Summary Section -->
            <div class="summary-container">
              <div class="words-box">
                <div class="words-label">Amount in Words</div>
                <div class="words-val">${amountInWords}</div>
              </div>

              <div class="totals-box">
                <div class="total-row">
                  <span style="color: #64748b;">Subtotal (MRP):</span>
                  <span style="font-weight: 600; font-family: 'JetBrains Mono', monospace;">₹${originalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                ${discountAmount > 0
        ? `<div class="total-row" style="color: #16a34a;">
                        <span>Special Discount (${discountPercent}%):</span>
                        <span style="font-weight: 700; font-family: 'JetBrains Mono', monospace;">-₹${discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>`
        : `<div class="total-row">
                        <span style="color: #64748b;">Discount:</span>
                        <span style="font-weight: 600; font-family: 'JetBrains Mono', monospace;">₹0.00</span>
                      </div>`
      }
                <div class="total-row">
                  <span style="color: #64748b;">Tax / GST:</span>
                  <span style="font-weight: 600; color: #64748b; font-family: 'JetBrains Mono', monospace;">₹0.00 (Exempt)</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total Paid:</span>
                  <span style="color: #16a34a; font-family: 'JetBrains Mono', monospace;">₹${amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- QR & Footer -->
            <div class="footer-section">
              <div class="qr-block">
                <img src="${qrCodeUrl}" alt="Invoice Verification QR Code" />
                <div class="qr-text">
                  <strong>Digital Verification</strong>
                  Scan this QR code to verify this SaaS subscription payment online.
                </div>
              </div>

              <div class="signature-box">
                <div class="signature-seal">✓ DIGITALLY VERIFIED</div>
                <div class="signatory-title">Authorized Signatory</div>
                <div class="signatory-sub">EasyTechnoMed</div>
              </div>
            </div>

            <!-- Terms & Conditions -->
            <div class="terms-box">
              <strong>Terms & Conditions:</strong><br />
              1. This is a computer-generated tax invoice & receipt for EasyTechnoMed SaaS Subscription Cloud Services.<br />
              2. Subscription services and diagnostic software access are activated immediately upon payment receipt.<br />
              3. For any billing questions or workspace support, contact us at <strong>support@easytechnomed.com</strong>.
            </div>
          </div>
        </body>
      </html>
    `;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("API error printing subscription invoice:", error);
    return new Response(`Server error generating subscription invoice: ${error.message}`, { status: 500 });
  }
}
