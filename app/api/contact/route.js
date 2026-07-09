import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name?.trim();
    const emailOrPhone = body.emailOrPhone?.trim();
    const message = body.message?.trim();

    if (!name || !emailOrPhone) {
      return NextResponse.json({ success: false, message: "Name and contact details are required." });
    }

    // Save to the database
    const leadContact = await prisma.leadContact.create({
      data: {
        name,
        emailOrPhone,
        message,
      },
    });

    // Send to Discord Webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const discordMessage = {
          embeds: [
            {
              title: "📩 New Contact Inquiry",
              color: 8141293, // #7c3aed (Violet)
              fields: [
                { name: "Name", value: name, inline: true },
                { name: "Contact", value: emailOrPhone, inline: true },
                { name: "Message", value: message || "*No message provided*", inline: false },
                { name: "Inquiry ID", value: String(leadContact.id), inline: true },
                { name: "Submitted At", value: new Date(leadContact.createdAt).toLocaleString("en-IN"), inline: true }
              ],
              footer: {
                text: "EasyTechnoMed LIMS Lead Management"
              }
            }
          ]
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordMessage),
        });
      } catch (err) {
        console.error("Failed to send notification to Discord Webhook:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Thank you for contacting us! Our team will get back to you shortly." });
  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
