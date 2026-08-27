import crypto from "crypto";

/**
 * Builds the Key Ring strictly from dedicated report environment variables.
 * Completely separate from user/auth JWT_SECRET.
 *
 * Dedicated ENV Variables:
 * - REPORT_ENCRYPTION_KEY: Primary dedicated report encryption secret
 * - ROTATED_REPORT_KEYS: Optional comma-separated list of historical report keys for rotation
 */
function getKeyRing() {
  const seeds = [];

  // 1. Dedicated Primary Report Encryption Key from ENV
  if (process.env.REPORT_ENCRYPTION_KEY) {
    seeds.push(process.env.REPORT_ENCRYPTION_KEY.trim());
  }

  // 2. Historical Rotated Report Keys from ENV (comma-separated)
  if (process.env.ROTATED_REPORT_KEYS) {
    const historical = process.env.ROTATED_REPORT_KEYS.split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    seeds.push(...historical);
  }

  // Remove duplicates and empty entries
  const uniqueSeeds = Array.from(new Set(seeds)).filter(Boolean);

  if (uniqueSeeds.length === 0) {
    throw new Error(
      "Report security error: Dedicated REPORT_ENCRYPTION_KEY is not configured in .env variables."
    );
  }

  return uniqueSeeds.map((seed) => ({
    // 32-byte AES-256 key derived strictly from dedicated report seed
    key: crypto.createHash("sha256").update(seed).digest(),
    // 16-byte IV derived strictly from dedicated report seed
    iv: crypto.createHash("md5").update(seed).digest(),
  }));
}

/**
 * Encrypts registration identity using the PRIMARY dedicated key from Key Ring.
 * Produces standard enterprise diagnostic format: e.g. "nrLNdm/O5xcU6RT9I4YyXzyilFUulSFjS9FWqwSkaTM="
 *
 * @param {Object} reg - Registration database object
 * @returns {string} Base64 encrypted string
 */
export function generateReportToken(reg) {
  if (!reg || (!reg.regNo && !reg.id)) return "";

  const regNo = String(reg.regNo || reg.id).trim();
  const secret = reg.pdfOtp ? String(reg.pdfOtp).trim() : "";
  const workspaceId = reg.workspaceId ? String(reg.workspaceId) : "";

  const plaintext = `${regNo}|${secret}|${workspaceId}`;
  const keyRing = getKeyRing();
  const primary = keyRing[0]; // Dedicated active key

  try {
    const cipher = crypto.createCipheriv("aes-256-cbc", primary.key, primary.iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch (err) {
    return crypto.createHmac("sha256", primary.key).update(plaintext).digest("base64");
  }
}

/**
 * Decrypts a token (v parameter) using dedicated keys configured in the Key Ring.
 * 
 * @param {string} tokenStr - The encrypted v parameter
 * @returns {Object|null} { regNo, secret, workspaceId } or null if invalid
 */
export function decryptReportToken(tokenStr) {
  if (!tokenStr) return null;
  const cleanStr = String(tokenStr).trim();
  if (!cleanStr) return null;

  const normalized = cleanStr.replace(/ /g, "+");
  const keyRing = getKeyRing();

  // Try each configured key in the Key Ring
  for (const { key, iv } of keyRing) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(normalized, "base64", "utf8");
      decrypted += decipher.final("utf8");

      const parts = decrypted.split("|");
      if (parts.length >= 1 && parts[0]) {
        return {
          regNo: parts[0],
          secret: parts[1] || "",
          workspaceId: parts[2] || "",
        };
      }
    } catch {
      // Continue to next key in key ring
    }
  }

  return null;
}

/**
 * Validates an access token for a registration.
 *
 * @param {string} token - The token or code provided in query params (v / t / token / otp)
 * @param {Object} reg - The registration object from database
 * @returns {boolean} True if authorized, False otherwise
 */
export function verifyReportToken(token, reg) {
  if (!token || !reg) return false;
  const cleanToken = String(token).trim();
  if (!cleanToken) return false;

  // 1. Primary: AES Key-Ring Decryption verification
  const decrypted = decryptReportToken(cleanToken);
  if (decrypted && decrypted.regNo) {
    const cleanRegNo = String(reg.regNo || reg.id).trim().toLowerCase();
    if (decrypted.regNo.toLowerCase() === cleanRegNo) {
      return true;
    }
  }

  // 2. Direct equality against token generated with active key
  const expectedToken = generateReportToken(reg);
  if (cleanToken === expectedToken || cleanToken.replace(/ /g, "+") === expectedToken) {
    return true;
  }

  // 3. Fallback: Direct pdfOtp match for legacy physical prints
  if (
    reg.pdfOtp &&
    (cleanToken.toLowerCase() === String(reg.pdfOtp).trim().toLowerCase() ||
      cleanToken === String(reg.pdfOtp).trim())
  ) {
    return true;
  }

  return false;
}
