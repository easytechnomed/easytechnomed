import nodemailer from "nodemailer";

async function testHostingerSmtp() {
  console.log("=== Testing Hostinger SMTP ===");
  const host = "smtp.hostinger.com";
  const port = 465;
  const user = "support@easytechnomed.com";
  const pass = "E@syTechnoMed@2001";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const verified = await transporter.verify();
    console.log("✓ Transporter Verification:", verified);

    const info = await transporter.sendMail({
      from: `"EasyTechnoMed Support" <${user}>`,
      replyTo: user,
      to: "miznaansari@gmail.com",
      subject: "Hostinger SMTP Direct Test",
      text: "This is a direct test message from Hostinger SMTP support@easytechnomed.com.",
      html: "<p>This is a direct test message from Hostinger SMTP <strong>support@easytechnomed.com</strong>.</p>",
    });

    console.log("✓ Hostinger Mail Sent! Details:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    console.error("✗ Hostinger SMTP Failed:", err);
  }
}

testHostingerSmtp();
