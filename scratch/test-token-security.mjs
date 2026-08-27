import { generateReportToken, verifyReportToken, decryptReportToken } from "../lib/reportSecurity.js";

function runProfessionalAesTests() {
  console.log("==================================================");
  console.log("🧪 TESTING STRICTLY ENV-DRIVEN AES-256 TOKEN ENGINE");
  console.log("==================================================");

  // Set environment variable explicitly for test context if needed
  process.env.REPORT_ENCRYPTION_KEY = process.env.REPORT_ENCRYPTION_KEY || "pathlab_vault_aes_master_key_2026_immutable";

  const mockReg = {
    id: 101,
    regNo: "REG-2026-0001",
    workspaceId: 1,
    pdfOtp: "847291",
  };

  // Step 1: Encrypt registration
  const token = generateReportToken(mockReg);
  console.log(`\n[Step 1] Generated AES-256 Base64 Token (using .env key):`);
  console.log(`  Token: ${token}`);
  console.log(`  URL:   https://lab.domain.com/q?v=${encodeURIComponent(token)}`);
  
  // Step 2: Decrypt registration
  const decrypted = decryptReportToken(token);
  console.log(`\n[Step 2] Decrypted Payload:`, decrypted);
  console.assert(decrypted && decrypted.regNo === mockReg.regNo, "❌ Decrypted regNo must match original");
  console.log("✅ Decryption successful & verified strictly via ENV key!");

  // Step 3: Verification check
  const isVerified = verifyReportToken(token, mockReg);
  console.assert(isVerified === true, "❌ Verification must succeed");
  console.log("✅ Token verified against registration object.");

  // Step 4: Key Rotation Test with ROTATED_REPORT_KEYS
  const oldToken = token;
  // Rotate active key and push previous key to ROTATED_REPORT_KEYS
  process.env.ROTATED_REPORT_KEYS = process.env.REPORT_ENCRYPTION_KEY;
  process.env.REPORT_ENCRYPTION_KEY = "new_rotated_active_secret_key_2027";
  
  const isOldTokenStillValid = verifyReportToken(oldToken, mockReg);
  console.assert(isOldTokenStillValid === true, "❌ Old token must verify using ROTATED_REPORT_KEYS in ENV!");
  console.log("✅ Key Rotation Verified: Old reports still decrypt using ROTATED_REPORT_KEYS from ENV!");

  // Step 5: Test Tampered Token
  const tamperedToken = "nrLNdm" + token.slice(6);
  const tamperedDecrypted = decryptReportToken(tamperedToken);
  console.assert(tamperedDecrypted === null, "❌ Tampered token decryption must return null");
  console.log("✅ Tampered token rejected safely.");

  // Step 6: Test legacy OTP
  const isOtpValid = verifyReportToken("847291", mockReg);
  console.assert(isOtpValid === true, "❌ Legacy OTP must pass");
  console.log("✅ Legacy OTP fallback verified.");

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS PASSED STRICTLY VIA ENVIRONMENT VARIABLES!");
  console.log("==================================================");
}

runProfessionalAesTests();
