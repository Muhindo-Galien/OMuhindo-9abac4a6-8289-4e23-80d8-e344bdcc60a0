/**
 * Shared string utilities used across features (auth, orgs, navigation, etc.).
 */

/**
 * Returns 1–2 character initials from first name, last name, or fallback to email.
 * Examples: "Jane Doe" → "JD", "Jane" → "JA", no name → first char of email or "?".
 */
export function getInitialsForUser(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  const f = (firstName ?? '').trim().charAt(0);
  const l = (lastName ?? '').trim().charAt(0);
  if (f || l) return (f + l).toUpperCase().slice(0, 2);
  const e = (email ?? '').trim();
  if (e) return e.charAt(0).toUpperCase();
  return '?';
}

/**
 * Returns up to 2 character initials from a phrase (e.g. org name).
 * "My Workspace" → "MW", "Acme" → "AC".
 */
export function getInitialsFromWords(text: string | null | undefined): string {
  if (!text?.trim()) return '?';
  const parts = text.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase().slice(0, 2);
  }
  return text.slice(0, 2).toUpperCase();
}
