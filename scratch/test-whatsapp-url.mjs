function getRegistrationWhatsappUrl(reg, labTitle, origin) {
  if (!reg || !reg.mobileNo) return null;
  const cleanMobile = String(reg.mobileNo).replace(/\D/g, "");
  if (cleanMobile.length < 10) return null;
  const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  const reportUrl = `${origin}/api/print-report/${reg.regNo}?otp=${reg.pdfOtp || ""}&withFrame=true`;
  const patientTitle = reg.title ? `${reg.title} ` : "";
  const totalAmt = parseFloat(reg.totalAmount || 0).toFixed(2);
  const dueAmt = parseFloat(reg.dueAmount || 0).toFixed(2);

  const text = 
`*🏥 ${labTitle || "Pathology Laboratory"}*
Hello ${patientTitle}${reg.name}, your test registration has been confirmed!

📋 *Reg No:* ${reg.regNo}
🔬 *Lab ID:* ${reg.labId || "-"}
💰 *Bill Amount:* ₹${totalAmt} | *Due:* ₹${dueAmt}
🔑 *Security Code / OTP:* ${reg.pdfOtp || "-"}

🔗 *Track Status & View Report:*
${reportUrl}

_Thank you for choosing us for your health diagnostics!_`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

const sampleReg = {
  name: "Rahul Sharma",
  title: "Mr.",
  mobileNo: "9876543210",
  regNo: "ETM-5V7N-00018",
  labId: "LAB-2026-001",
  totalAmount: 1200,
  dueAmount: 500,
  pdfOtp: "640849",
};

const url = getRegistrationWhatsappUrl(sampleReg, "Care Diagnostic Lab", "http://localhost:3000");
console.log("Generated WhatsApp URL:\n", url);
console.log("\nDecoded Message Preview:\n", decodeURIComponent(url.split("text=")[1]));
