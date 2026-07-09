import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function numberToWords(num) {
  if (num === 0) return "Zero";
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
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + g(n % 100) : "");
    }
    return g(n);
  }

  let str = "";
  let temp = Math.floor(num);
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
  return str.trim() + " Rupees";
}

export async function GET(req, { params }) {
  try {
    const { registrationId } = await params;
    let regId = parseInt(registrationId);
    let reg = null;

    if (!isNaN(regId)) {
      reg = await prisma.registration.findFirst({
        where: { id: regId, isDeleted: false },
        include: {
          refBy: true,
          tests: {
            include: {
              test: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    }

    if (!reg) {
      reg = await prisma.registration.findFirst({
        where: {
          isDeleted: false,
          OR: [
            { barcode: { contains: registrationId } },
            { regNo: registrationId },
            { labId: registrationId }
          ]
        },
        include: {
          refBy: true,
          tests: {
            include: {
              test: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    }

    if (!reg) {
      return new Response("Registration not found", { status: 404 });
    }

    // Retrieve active configuration from the workspace admin
    const configAdmin = await prisma.admin.findFirst({
      where: { workspaceId: reg.workspaceId },
      include: {
        address: true,
      },
    });

    const companyName = configAdmin?.companyName || "Technomed Laboratory";
    const email = configAdmin?.email || "";
    
    const addr = configAdmin?.address;
    const addrString = addr 
      ? `${addr.address1 || ""}, ${addr.address2 || ""}, ${addr.city || ""}-${addr.pincode || ""}, ${addr.state || ""}, ${addr.country || ""}`
      : "Address details not configured";

    const subtotal = reg.tests?.reduce((sum, t) => sum + parseFloat(t.test?.price || 0), 0) || 0;
    const collCharge = parseFloat(reg.collectionCharge || 0);
    const discAmount = parseFloat(reg.discountAmount || 0);
    const discPercent = parseFloat(reg.discountPercent || 0);
    const netAmount = subtotal + collCharge - discAmount;
    const paidAmount = parseFloat(reg.receivedAmount || 0);
    const dueAmount = parseFloat(reg.dueAmount || 0);

    const testRows = reg.tests?.map((t, idx) => `
      <tr>
        <td style="padding: 8px 0; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 0;">${t.test?.name || "Test"}</td>
        <td style="padding: 8px 0; color: #555;">-</td>
        <td align="right" style="padding: 8px 0; font-family: monospace;">${parseFloat(t.test?.price || 0).toFixed(2)}</td>
      </tr>
    `).join("") || "";

    const currentDateStr = new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
    const regDateStr = formatDate(reg.date);

    // QR Codes
    const cleanBarcode = reg.barcode ? reg.barcode.replace(/^,\s*/, "").split(" ")[0] : null;
    const qrReportData = `${req.nextUrl.origin}/api/print-report/${cleanBarcode || reg.id}?withFrame=true`;
    const qrReportUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrReportData)}`;

    const qrPaymentData = `${req.nextUrl.origin}/api/print-bill/${reg.id}`;
    const qrPaymentUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPaymentData)}`;

    const receivedAmt = parseFloat(reg.receivedAmount || 0);
    const receivedWords = numberToWords(receivedAmt);

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Money Receipt - ${reg.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: 'Arial', sans-serif; font-size: 13px; color: #000; }
              @page { size: auto; margin: 15mm; }
            }
            body { font-family: 'Arial', sans-serif; font-size: 13px; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            .header { text-align: center; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 4px 0; font-size: 14px; }
            .divider { border-bottom: 2px solid #000; margin-top: 10px; margin-bottom: 5px; }
            .title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .details-table td { padding: 4px 0; vertical-align: top; }
            .details-label { font-weight: bold; width: 15%; }
            .details-value { width: 35%; }
            .investigations-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .investigations-table th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0; text-align: left; font-weight: bold; }
            .investigations-table td { border-bottom: 1px dashed #ccc; padding: 6px 0; }
            .investigations-table tr:last-child td { border-bottom: 1px solid #000; }
            .total-row { font-weight: bold; }
            .receipt-footer { margin-top: 20px; font-size: 12px; line-height: 1.6; }
            .signatory { text-align: right; margin-top: 50px; font-weight: bold; }
            .qr-barcodes { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
            .barcode-box { display: flex; flex-direction: column; align-items: center; }
            .barcode-lines { font-family: 'Libre Barcode 39', cursive; font-size: 42px; line-height: 1; margin: 0; }
            .qr-container { display: flex; gap: 30px; }
            .qr-box { text-align: center; font-size: 10px; font-weight: bold; }
            .qr-image { width: 80px; height: 80px; margin-bottom: 5px; border: 1px solid #eee; padding: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyName}</h1>
            <p>${addrString}</p>
            <p>Email: ${email}</p>
          </div>
          <div class="divider"></div>
          <div class="title">MONEY RECEIPT</div>
          
          <table class="details-table">
            <tr>
              <td class="details-label">Bill No</td>
              <td class="details-value">: ${reg.id}</td>
              <td class="details-label">Date</td>
              <td class="details-value">: ${regDateStr}</td>
            </tr>
            <tr>
              <td class="details-label">Reg.No</td>
              <td class="details-value">: ${reg.regNo}</td>
              <td class="details-label">Ref. By</td>
              <td class="details-value">: ${reg.refBy?.name || "Self"}</td>
            </tr>
            <tr>
              <td class="details-label">Patient Name</td>
              <td class="details-value">: ${reg.title} ${reg.name}</td>
              <td class="details-label">Age/Sex</td>
              <td class="details-value">: ${reg.age} ${reg.ageUnit} / ${reg.gender}</td>
            </tr>
            <tr>
              <td class="details-label">Address</td>
              <td class="details-value">: ${reg.city}</td>
              <td class="details-label">Cont. No</td>
              <td class="details-value">: ${reg.mobileNo}</td>
            </tr>
          </table>

          <table class="investigations-table">
            <thead>
              <tr>
                <th width="8%">SL</th>
                <th width="62%">Investigation</th>
                <th width="15%">Reporting</th>
                <th width="15%" align="right" style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${testRows}
              <tr class="total-row">
                <td colspan="2"></td>
                <td align="right" style="white-space: nowrap;">Subtotal:</td>
                <td align="right" style="font-family: monospace;">₹${subtotal.toFixed(2)}</td>
              </tr>
              ${collCharge > 0 ? `
              <tr class="total-row">
                <td colspan="2"></td>
                <td align="right" style="white-space: nowrap;">Collection Charge:</td>
                <td align="right" style="font-family: monospace;">₹${collCharge.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${discAmount > 0 ? `
              <tr class="total-row" style="color: #16a34a;">
                <td colspan="2"></td>
                <td align="right" style="white-space: nowrap;">Discount ${discPercent > 0 ? `(${discPercent}%)` : ''}:</td>
                <td align="right" style="font-family: monospace;">-₹${discAmount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row" style="border-top: 1px double #000; border-bottom: 1px double #000;">
                <td colspan="2"></td>
                <td align="right" style="white-space: nowrap;">Net Amount:</td>
                <td align="right" style="font-family: monospace;">₹${netAmount.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2"></td>
                <td align="right" style="white-space: nowrap;">Paid:</td>
                <td align="right" style="font-family: monospace; color: #047857;">₹${paidAmount.toFixed(2)}</td>
              </tr>
              <tr class="total-row" style="color: #b91c1c;">
                <td colspan="2"></td>
                <td align="right" style="white-space: nowrap;">Due:</td>
                <td align="right" style="font-family: monospace;">₹${dueAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="receipt-footer">
            <div><strong>Received Amount :</strong> ${receivedWords} Only By: ${reg.paymentMode || "Cash"}</div>
            <div style="color: #666; margin-top: 5px;">Printed By : ${companyName} @ ${currentDateStr}</div>
          </div>

          <div class="qr-barcodes">
            <div class="barcode-box">
              <div class="barcode-lines">*${reg.regNo}*</div>
              <div style="font-size: 11px; margin-top: 4px;">${reg.regNo}</div>
            </div>
            
            <div class="qr-container">
              <div class="qr-box">
                <img class="qr-image" src="${qrReportUrl}" />
                <br />
                <span>(SCAN FOR REPORT)</span>
              </div>
              <div class="qr-box">
                <img class="qr-image" src="${qrPaymentUrl}" />
                <br />
                <span>(SCAN FOR PAYMENT)</span>
              </div>
            </div>

            <div class="signatory">
              <div style="border-top: 1px solid #000; width: 180px; margin-bottom: 5px;"></div>
              (AUTHORIZED SIGNATORY)
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
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
    console.error("API error printing bill receipt:", error);
    return new Response(`Server error generating bill: ${error.message}`, { status: 500 });
  }
}
