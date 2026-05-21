/**
 * Contact email — single source of truth. Read from NEXT_PUBLIC_CONTACT_EMAIL
 * so the address can change per environment without touching source. Empty
 * fallback in source keeps personal info out of the public git history.
 *
 * If unset at build time, contact CTAs render as text-only (no mailto link).
 * In Vercel: set NEXT_PUBLIC_CONTACT_EMAIL to whatever inbox should receive
 * inbound founder messages.
 */
export const CONTACT_EMAIL: string = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '';

export function mailto(subject: string): string | undefined {
  if (!CONTACT_EMAIL) return undefined;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
