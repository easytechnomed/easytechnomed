import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

async function callGeminiModels(prompt, apiKey) {
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  let lastError = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text.trim();
        }
      } else {
        const errText = await res.text();
        console.warn(`[Gemini API] Model ${model} returned error status ${res.status}:`, errText);
        lastError = new Error(`Model ${model} failed (${res.status}): ${errText}`);
      }
    } catch (err) {
      console.warn(`[Gemini API] Exception with model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to generate response.");
}

export async function POST(req) {
  try {
    await requireAdmin("REGISTRATION_READ");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "GEMINI_API_KEY is not configured in server environment." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { patientInfo = {}, tests = [] } = body;

    // Filter out tests with at least some observed parameter values
    const validTests = tests
      .map((t) => {
        const validParams = (t.parameters || []).filter(
          (p) => !p.isHeader && p.value !== undefined && p.value !== null && String(p.value).trim() !== ""
        );
        return {
          testName: t.testName || t.name,
          parameters: validParams,
        };
      })
      .filter((t) => t.parameters.length > 0);

    if (validTests.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please enter at least one test result value before generating AI remarks." },
        { status: 400 }
      );
    }

    // Build structured medical report summary for prompt
    let reportDataText = `Patient Details:\n- Age: ${patientInfo.age || "N/A"} ${patientInfo.ageUnit || "Years"}\n- Gender: ${patientInfo.gender || "N/A"}\n\nObserved Laboratory Test Findings:\n`;

    validTests.forEach((t, tIdx) => {
      reportDataText += `\nTest ${tIdx + 1}: ${t.testName}\n`;
      t.parameters.forEach((p) => {
        const range = p.rangeStr || p.normalRangeDefault || (p.min !== undefined && p.max !== undefined ? `${p.min} - ${p.max}` : "N/A");
        const flagText = p.flag ? ` [FLAG: ${p.flag}]` : "";
        reportDataText += `  - ${p.name || p.code}: ${p.value} ${p.unit || ""}${range !== "N/A" ? ` (Ref: ${range} ${p.unit || ""})` : ""}${flagText}\n`;
      });
    });

    const prompt = `You are an expert pathologist and clinical laboratory reporting specialist.
Analyze the following patient's laboratory test results and write a short, crisp, simple, and professional summary note in plain English.

${reportDataText}

Guidelines:
1. START DIRECTLY with the first finding/observation. Do NOT output any heading, title, intro phrase, or label (such as "**Clinical Remarks:**", "**Report Summary:**", "**Summary:**", or "**Impression:**").
2. Provide a concise, clear clinical impression (max 2 to 4 short bullet points or 1 concise paragraph, max 60-80 words).
3. Highlight significant abnormal/critical values (e.g. anemia severity, infection indicators, liver/kidney alterations) in simple medical English.
4. If all parameters are within normal reference range, state clearly: "* All evaluated parameters are within standard biological reference ranges."
5. Add a standard closing advice note: "* Please correlate clinically."
6. Do NOT include markdown headers (# or ##). Keep the output clean and direct.`;

    const rawSuggestion = await callGeminiModels(prompt, apiKey);

    // Clean up any accidental leading title/heading like "**Clinical Remarks:**" or "**Report Summary:**"
    let cleanSuggestion = (rawSuggestion || "").trim();
    cleanSuggestion = cleanSuggestion
      .replace(/^(\*{0,2}(Clinical Remarks|Report Summary|Summary Note|Remarks|Impression|Summary|Note)\*{0,2}\s*:\s*\n*)/i, "")
      .replace(/^(#+\s*(Clinical Remarks|Report Summary|Summary Note|Remarks|Impression|Summary|Note)\s*\n*)/i, "")
      .trim();

    return NextResponse.json({
      success: true,
      suggestion: cleanSuggestion,
    });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("AI Suggestion POST Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}
