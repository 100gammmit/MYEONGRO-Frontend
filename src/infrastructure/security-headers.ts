// Sent with every Front response (next.config.ts headers()). The CSP sets only directives that
// cannot break Next.js's inline bootstrap scripts and styles: it stops framing (clickjacking on
// account deletion and consent screens), <base> rewrites, foreign form targets and plugins.
// Restricting scripts needs per-request nonces and is separate work.
export const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
] as const;
