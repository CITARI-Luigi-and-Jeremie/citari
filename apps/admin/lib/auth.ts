/** Auth v1 : mot de passe unique en env var, cookie = SHA-256 du mot de passe. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const SESSION_COOKIE = "admin_session";
