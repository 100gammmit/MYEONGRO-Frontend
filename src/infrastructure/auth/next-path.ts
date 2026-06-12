const DEFAULT_NEXT_PATH = "/records";
const MAX_DECODE_PASSES = 4;
const LOCAL_ORIGIN = "https://local.invalid";
const SCHEME_AFTER_ROOT = /^\/[a-z][a-z0-9+.-]*:/i;
const ASCII_CONTROL = /[\u0000-\u001f\u007f]/;
const ENCODED_DANGEROUS_TOKEN =
  /%(?:0[0-9a-f]|1[0-9a-f]|25|2f|3a|5c|7f)/i;

function isDangerousPath(value: string): boolean {
  return (
    value.startsWith("//") ||
    value.includes("\\") ||
    ASCII_CONTROL.test(value) ||
    SCHEME_AFTER_ROOT.test(value)
  );
}

export function normalizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  let inspected = value;
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    if (isDangerousPath(inspected)) return DEFAULT_NEXT_PATH;

    let decoded: string;
    try {
      decoded = decodeURIComponent(inspected);
    } catch {
      return DEFAULT_NEXT_PATH;
    }

    if (decoded === inspected) break;
    inspected = decoded;
  }

  if (isDangerousPath(inspected) || ENCODED_DANGEROUS_TOKEN.test(inspected)) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const resolved = new URL(value, LOCAL_ORIGIN);
    if (resolved.origin !== LOCAL_ORIGIN) return DEFAULT_NEXT_PATH;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}
