import crypto from "crypto";

const SECRET =
  process.env.JWT_SECRET ||
  process.env.DATABASE_URL ||
  "easytechnomed-saas-billing-secure-key-2026";
const KEY = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Encodes a numeric payment ID into an obfuscated, tamper-proof UID string.
 * Example output: "pmt_8a9b2c3d..."
 *
 * @param {number|string} id - The database ID of the WorkspacePayment
 * @returns {string} The secure UID token
 */
export function encodePaymentUid(id) {
  if (!id) return "";
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    const payload = JSON.stringify({
      id: Number(id),
      r: crypto.randomBytes(4).toString("hex"),
    });
    const encrypted = Buffer.concat([
      cipher.update(payload, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);
    return `pmt_${combined.toString("base64url")}`;
  } catch (err) {
    console.error("Error encoding payment UID:", err);
    return `pmt_${id}`;
  }
}

/**
 * Decodes a payment UID string back into the numeric payment ID.
 * Strictly requires a valid encrypted UID token (e.g. "pmt_...").
 * Direct numeric database IDs are strictly rejected.
 *
 * @param {string} token - The UID token
 * @returns {number|null} The resolved payment ID or null
 */
export function decodePaymentUid(token) {
  if (!token) return null;
  const cleanToken = String(token).trim();

  // Explicitly reject direct numeric database IDs
  if (/^\d+$/.test(cleanToken)) {
    return null;
  }

  const rawToken = cleanToken.startsWith("pmt_")
    ? cleanToken.slice(4)
    : cleanToken;

  try {
    const combined = Buffer.from(rawToken, "base64url");
    if (combined.length >= 29) {
      const iv = combined.subarray(0, 12);
      const tag = combined.subarray(12, 28);
      const encrypted = combined.subarray(28);
      const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      const data = JSON.parse(decrypted.toString("utf8"));
      if (data && data.id) {
        return Number(data.id);
      }
    }
  } catch (err) {
    // Decipher failed or tampered token
  }

  return null;
}
