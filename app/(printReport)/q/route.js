  import { NextResponse } from "next/server";
import { decryptReportToken } from "@/lib/reportSecurity";

export async function GET(req) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let token = (
      searchParams.get("v") ||
      searchParams.get("t") ||
      searchParams.get("token") ||
      searchParams.get("otp") ||
      ""
    ).trim();

    if (!token) {
      for (const [key, value] of searchParams.entries()) {
        const cleanKey = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (["v", "t", "token", "code", "otp"].includes(cleanKey)) {
          token = String(value).trim();
          break;
        }
      }
    }

    if (!token) {
      return new Response("Invalid or missing verification parameter.", { status: 400 });
    }

    // Decrypt AES payload
    const decrypted = decryptReportToken(token);
    if (!decrypted || !decrypted.regNo) {
      const unauthorizedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Restricted - Diagnostic Verification</title>
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
              <div class="icon-box">🔒</div>
              <div class="subtitle">Diagnostic Security System</div>
              <h1>Invalid Verification Code</h1>
              <p>The verification code provided is invalid or has expired.</p>
              <div class="hint">
                📲 <strong>How to view your report:</strong><br/>
                Please scan the official QR code printed on your laboratory test report.
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

    // Direct redirect to print-report or print-bill route with the encrypted token
    const origin = req.nextUrl.origin;
    const type = searchParams.get("type");
    const targetPath = type === "bill" || type === "receipt" ? "print-bill" : "print-report";
    const redirectUrl = new URL(`/api/${targetPath}/${encodeURIComponent(decrypted.regNo)}`, origin);
    redirectUrl.searchParams.set("v", token);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Verification route error:", error);
    return new Response("An error occurred during report verification.", { status: 500 });
  }
}
