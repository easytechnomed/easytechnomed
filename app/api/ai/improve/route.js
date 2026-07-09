import { NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1524747861453967471/QLDqiPFrG3t8a98OMvGTt6e9gmydYo0LS0qtcDgtJdpbhe1pydylzOMV_hUJdTXSN6o0";

// Helper function to call Gemini API with model fallback
async function callGemini(apiKey, text) {
  const models = ["gemini-2.0-flash-lite-preview-02-05", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional assistant. Correct the spelling, grammar, punctuation, and flow of the following message, and improve its professional tone. Output ONLY the corrected/improved message. Do NOT add any extra text, comments, quotes, or explanations. If it is already perfect, return it exactly as is.\n\nMessage: ${text}`
            }]
          }]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (improvedText) {
        return { improvedText: improvedText.trim(), model };
      }
      throw new Error("Invalid response format from Gemini API");
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini models failed");
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ success: false, message: "Message is required." }, { status: 400 });
    }

    // Configure keys in fallback order
    const keys = [
      { name: "Primary", key: process.env.GEMINI_API_KEY },
      { name: "Fallback 1", key: process.env.GEMINI_API_KEY_FALLBACK_1 },
      { name: "Fallback 2", key: process.env.GEMINI_API_KEY_FALLBACK_2 },
    ].filter(k => k.key);

    if (keys.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Gemini API keys are not configured in environment variables."
      }, { status: 500 });
    }

    let improvedText = "";
    let activeKeyName = "";
    let activeModel = "";
    let success = false;
    let attemptsLog = [];

    for (const keyObj of keys) {
      try {
        const result = await callGemini(keyObj.key, message);
        improvedText = result.improvedText;
        activeModel = result.model;
        activeKeyName = keyObj.name;
        success = true;
        attemptsLog.push({ name: keyObj.name, status: "Success", model: result.model });
        break; // Stop falling back since we succeeded!
      } catch (err) {
        console.error(`Gemini call failed with key ${keyObj.name}:`, err.message);
        attemptsLog.push({ name: keyObj.name, status: `Failed: ${err.message}` });
      }
    }

    // Trigger Discord Webhook reporting key usage and status details
    try {
      const discordEmbed = {
        embeds: [
          {
            title: success ? "🤖 Gemini AI Grammar Correction - Success" : "❌ Gemini AI Grammar Correction - Failed",
            color: success ? 1357674 : 15548997, // Teal #14b8a6 vs Red #ed4245
            fields: [
              { name: "Key Used / Succeeded", value: success ? activeKeyName : "None (All Failed)", inline: true },
              { name: "Model Used", value: success ? activeModel : "N/A", inline: true },
              { name: "Timestamp", value: new Date().toLocaleString("en-IN"), inline: true },
              {
                name: "Attempts Log",
                value: attemptsLog.map(a => `• **${a.name}**: ${a.status} ${a.model ? `[${a.model}]` : ""}`).join("\n"),
                inline: false
              },
              { name: "Original Message", value: message.length > 500 ? message.substring(0, 500) + "..." : message, inline: false },
              {
                name: "Improved Message",
                value: success
                  ? (improvedText.length > 500 ? improvedText.substring(0, 500) + "..." : improvedText)
                  : "*Correction failed*",
                inline: false
              }
            ],
            footer: {
              text: "EasyTechnoMed LIMS AI Assistant"
            }
          }
        ]
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordEmbed)
      });
    } catch (discordErr) {
      console.error("Failed to trigger AI Discord notification webhook:", discordErr);
    }

    if (success) {
      return NextResponse.json({ success: true, improvedText });
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to correct message. Please check API key configurations."
      }, { status: 500 });
    }
  } catch (error) {
    console.error("AI Improve Endpoint Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
