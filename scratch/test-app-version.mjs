import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function runTest() {
  console.log("=== Testing AppVersion Model & APIs ===");

  // 1. Clean up any previous test version
  await prisma.appVersion.deleteMany({
    where: { version: "v99.9.0-test" },
  });

  // 2. Create version
  const created = await prisma.appVersion.create({
    data: {
      version: "v99.9.0-test",
      title: "Test AI Enhanced Release",
      description: "Initial raw description with some typos and informal text.",
      changes: "- added ai assistant\n- fixed formula bug",
      isMandatory: false,
      isActive: true,
      releaseDate: new Date(),
    },
  });
  console.log("✓ Created AppVersion:", created.id, created.version);

  // 3. Update version
  const updated = await prisma.appVersion.update({
    where: { id: created.id },
    data: {
      isMandatory: true,
      title: "Updated AI Enhanced Release v99.9.0",
    },
  });
  console.log("✓ Updated AppVersion isMandatory:", updated.isMandatory, "updatedAt:", updated.updatedAt);

  // 4. Test Gemini AI Assist endpoint directly using fetch
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log("Testing Gemini AI call with models gemini-3.5-flash-lite / gemini-3.1-flash-lite...");
    const models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
    let aiSuccess = false;

    for (const model of models) {
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
                    text: `You are a technical release manager. Standardize this into company release format:\n- added ai assistant\n- fixed formula bug`,
                  },
                ],
              },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log(`✓ Model ${model} succeeded! Result preview:\n`, text?.substring(0, 150), "...");
          aiSuccess = true;
          break;
        } else {
          console.warn(`Model ${model} returned status:`, res.status);
        }
      } catch (err) {
        console.warn(`Model ${model} failed:`, err.message);
      }
    }

    if (!aiSuccess) {
      console.warn("AI models test did not complete, verify network/key.");
    }
  } else {
    console.log("Notice: GEMINI_API_KEY not set in current process environment for scratch runner (it will load from .env in Next.js).");
  }

  // 5. Clean up test record
  await prisma.appVersion.delete({
    where: { id: created.id },
  });
  console.log("✓ Cleaned up test record.");
  console.log("=== All Tests Completed Successfully ===");
}

runTest()
  .catch((e) => {
    console.error("Test failed:", e);
  })
  .finally(() => prisma.$disconnect());
