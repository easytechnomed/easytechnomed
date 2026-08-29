import { NextResponse } from "next/server";
import { verifySuperAdminAPI } from "@/lib/auth";

// Models specifically restricted to gemini-3.5-flash-lite and gemini-3.1-flash-lite
const ALLOWED_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

async function callGemini(apiKey, systemInstruction, userPrompt) {
  let lastError = null;

  for (const model of ALLOWED_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemInstruction}\n\nInput Content:\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return {
            text: text.trim(),
            model,
            usage: data?.usageMetadata || {},
          };
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`[Gemini AI Assist] Model ${model} returned HTTP ${res.status}:`, errText);
        lastError = new Error(`Model ${model} failed (${res.status}): ${errText}`);
      }
    } catch (err) {
      console.warn(`[Gemini AI Assist] Error calling ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All specified Gemini models failed.");
}

export async function POST(req) {
  try {
    await verifySuperAdminAPI();

    const body = await req.json().catch(() => ({}));
    const { action = "grammar", text = "", version = "", title = "", fieldType = "description" } = body;

    const trimmedText = text?.trim();
    if (!trimmedText) {
      return NextResponse.json(
        { success: false, error: "Text content is required for AI processing." },
        { status: 400 }
      );
    }

    // Configure keys with fallback
    const keys = [
      { name: "Primary", key: process.env.GEMINI_API_KEY },
      { name: "Fallback 1", key: process.env.GEMINI_API_KEY_FALLBACK_1 },
      { name: "Fallback 2", key: process.env.GEMINI_API_KEY_FALLBACK_2 },
    ].filter((k) => k.key);

    if (keys.length === 0) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured in server environment." },
        { status: 500 }
      );
    }

    let systemInstruction = "";

    switch (action) {
      case "grammar":
        systemInstruction = `You are an expert technical editor.
Goal: Carefully check and correct spelling, grammar, punctuation, capitalization, and sentence flow of the provided application release text.
Guidelines:
1. Preserve the original meaning, technical terms, and intended details.
2. Fix all grammatical slips, typos, awkward phrasing, and inconsistent punctuation.
3. Return ONLY the corrected text. Do NOT add preamble, conversational remarks, or markdown code fence wrappers (\`\`\`).`;
        break;

      case "rephrase":
        systemInstruction = `You are a professional product communication specialist for EasyTechnoMed LIMS (Laboratory Information Management System).
Goal: Rephrase and polish the provided release notes or description to be clear, professional, engaging, and user-friendly for laboratory doctors, administrators, and healthcare staff.
Guidelines:
1. Make the tone confident, clean, and customer-centric.
2. Ensure clarity and easy reading while preserving key technical facts.
3. Return ONLY the rephrased content. Do NOT include greetings, intro phrases, or markdown code fence wrappers (\`\`\`).`;
        break;

      case "optimize":
        systemInstruction = `You are an expert technical product manager.
Goal: Optimize and condense the provided release notes into punchy, high-impact, easy-to-scan release highlights.
Guidelines:
1. Convert rambling or dense paragraphs into concise bullet points or structured highlights.
2. Focus on the core value or fix for the end user.
3. Remove fluff and redundant phrases.
4. Return ONLY the optimized text. Do NOT include markdown code fence wrappers (\`\`\`).`;
        break;

      case "standard":
      default:
        systemInstruction = `You are the lead release manager for EasyTechnoMed Enterprise LIMS.
Goal: Format and organize the provided release details into the standard company enterprise changelog format.
Guidelines:
1. Structure the output into standard sections where applicable (only include sections that have relevant changes):
   - 🚀 **New Features**: Major new capabilities or additions.
   - ⚡ **Enhancements & Improvements**: Performance, UI/UX, or workflow upgrades.
   - 🛠️ **Bug Fixes**: Resolved issues, stability, and calculations.
   - 🔒 **Security & Reliability**: Compliance, authentication, or infrastructure updates.
2. Use clean markdown bullet points under each header.
3. Keep bullet points concise and professional.
4. Return ONLY the structured release notes. Do NOT include intro or outro conversational text.`;
        break;
    }

    let resultText = "";
    let modelUsed = "";
    let lastErr = null;

    for (const keyObj of keys) {
      try {
        const result = await callGemini(keyObj.key, systemInstruction, trimmedText);
        resultText = result.text;
        modelUsed = result.model;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!resultText) {
      throw lastErr || new Error("Failed to process text with Gemini AI.");
    }

    // Clean any accidental triple backticks if the model returned them
    resultText = resultText
      .replace(/^```(markdown|text)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return NextResponse.json({
      success: true,
      resultText,
      modelUsed,
      action,
    });
  } catch (error) {
    console.error("SuperAdmin AppVersion AI Assist Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process AI request." },
      { status }
    );
  }
}
