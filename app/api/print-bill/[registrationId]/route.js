import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { generateReportToken, verifyReportToken } from "@/lib/reportSecurity";

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
    // 1. Primary lookup by regNo
    let reg = await prisma.registration.findFirst({
      where: { regNo: registrationId, isDeleted: false },
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

    // 2. Fallback lookup by numeric ID, barcode, or labId
    if (!reg) {
      let regId = parseInt(registrationId);
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
    }

    if (!reg) {
      reg = await prisma.registration.findFirst({
        where: {
          isDeleted: false,
          OR: [
            { barcode: { contains: registrationId } },
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
      return new Response("Receipt not found", { status: 404 });
    }

    // Auto-populate pdfOtp if legacy registration has null pdfOtp
    if (!reg.pdfOtp) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.registration.update({
        where: { id: reg.id },
        data: { pdfOtp: generatedOtp },
      }).catch(() => {});
      reg.pdfOtp = generatedOtp;
    }

    const cookieStore = await cookies();
    const isAdminToken = cookieStore.get("admin_session_token")?.value;
    const isSuperAdminToken = cookieStore.get("super_admin_session_token")?.value;
    const isUserToken = cookieStore.get("session_token")?.value;

    let isStaff = false;

    if (isAdminToken) {
      const decoded = verifyToken(isAdminToken);
      if (decoded) {
        const session = await prisma.adminSession.findUnique({
          where: { token: isAdminToken },
          include: { admin: true },
        });
        if (session && session.expiresAt > new Date() && session.admin.isActive) {
          // Strict workspace check: Admin ONLY has staff access to their OWN workspace!
          if (session.admin.workspaceId === reg.workspaceId) {
            isStaff = true;
          }
        }
      }
    }

    if (isSuperAdminToken) {
      const decoded = verifyToken(isSuperAdminToken);
      if (decoded) {
        const session = await prisma.superAdminSession.findUnique({
          where: { token: isSuperAdminToken },
        });
        if (session && session.expiresAt > new Date()) {
          isStaff = true;
        }
      }
    }

    if (isUserToken) {
      const decoded = verifyToken(isUserToken);
      if (decoded) {
        const session = await prisma.userSession.findUnique({
          where: { token: isUserToken },
          include: { user: true },
        });
        if (session && session.expiresAt > new Date() && session.user.isApproved && !session.user.rejected) {
          if (session.user.workspaceId === reg.workspaceId) {
            isStaff = true;
          }
        }
      }
    }

    // ── PUBLIC ACCESS SECURITY CHECKS (If not authenticated as own lab staff) ──
    if (!isStaff) {
      const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
      let reqToken = (
        searchParams.get("v") ||
        searchParams.get("t") ||
        searchParams.get("token") ||
        searchParams.get("otp") ||
        searchParams.get("otp?") ||
        searchParams.get("code") ||
        ""
      ).trim();

      if (!reqToken) {
        for (const [key, value] of searchParams.entries()) {
          const cleanKey = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          if (["v", "token", "t", "code", "otp"].includes(cleanKey)) {
            reqToken = String(value).trim();
            break;
          }
        }
      }

      // Security Access Token OR Legacy OTP Verification
      const isAuthorized = verifyReportToken(reqToken, reg) || Boolean(reg.pdfOtp && reqToken === String(reg.pdfOtp).trim());
      if (!isAuthorized) {
        const unauthorizedHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Access Restricted - Money Receipt</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: white; padding: 36px 28px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); max-width: 480px; width: 100%; text-align: center; border-top: 4px solid #ef4444; }
                .icon-box { width: 64px; height: 64px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 30px; border: 2px solid #fecaca; }
                h1 { font-size: 20px; margin: 0 0 8px; font-weight: 800; color: #0f172a; }
                .subtitle { font-size: 13px; color: #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
                p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
                .hint { font-size: 13px; color: #334155; line-height: 1.6; background: #f0fdf4; padding: 14px; border-radius: 10px; border-left: 4px solid #0f766e; text-align: left; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon-box">🧾</div>
                <div class="subtitle">Secure Billing System</div>
                <h1>Access Restricted</h1>
                <p>To protect patient financial and medical confidentiality, money receipts require an authorized cryptographic verification link.</p>
                
                <div class="hint">
                  📲 <strong>How to view this receipt:</strong><br/>
                  1. Scan the <strong>QR code</strong> printed on your official receipt or test report.<br/>
                  2. Or click the secure verification link sent to your registered <strong>WhatsApp / SMS</strong>.
                </div>
              </div>
            </body>
          </html>
        `;
        return new Response(unauthorizedHtml, {
          status: 401,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    // Fetch workspace address details from AdminAddress
    const adminRecord = await prisma.admin.findFirst({
      where: { workspaceId: reg.workspaceId },
      include: { address: true }
    });

    const companyName = adminRecord?.companyName || "Technomed Laboratory";
    const email = adminRecord?.email || "";
    const phoneNo = adminRecord?.mobileNumber || "-";
    const addr = adminRecord?.address;
    const addrString = addr
      ? [addr.address1, addr.address2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")
      : "Diagnostic & Clinical Pathology Center";

    const subtotal = reg.tests?.reduce((sum, t) => sum + parseFloat(t.price !== undefined ? t.price : t.test?.price || 0), 0) || 0;
    const collCharge = parseFloat(reg.collectionCharge || 0);
    const discAmount = parseFloat(reg.discountAmount || 0);
    const discPercent = parseFloat(reg.discountPercent || 0);
    const netAmount = subtotal + collCharge - discAmount;
    const paidAmount = parseFloat(reg.receivedAmount || 0);
    const dueAmount = parseFloat(reg.dueAmount || 0);

    // Format tests table rows
    const testRows = reg.tests?.map((t, idx) => `
      <tr>
        <td style="padding: 8px 0; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 0;">${t.test?.name || "Diagnostic Test"}</td>
        <td style="padding: 8px 0; color: #555;">-</td>
        <td align="right" style="padding: 8px 0; font-family: monospace;">${parseFloat(t.price !== undefined ? t.price : t.test?.price || 0).toFixed(2)}</td>
      </tr>
    `).join("") || "";

    const currentDateStr = new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
    const regDateStr = formatDate(reg.date);

    // QR Codes with regNo and encrypted token
    const publicToken = generateReportToken(reg);
    const qrReportData = `${req.nextUrl.origin}/q?v=${encodeURIComponent(publicToken)}`;
    const qrReportUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrReportData)}`;

    const qrPaymentData = `${req.nextUrl.origin}/q?v=${encodeURIComponent(publicToken)}&type=bill`;
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
