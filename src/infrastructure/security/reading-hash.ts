import { createHash, createHmac } from "node:crypto";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function hashReadingInput(input: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(input)))
    .digest("hex");
}

export function hashRequestIp(request: Request, secret: string): string {
  const forwardedIp = request.headers.get("x-forwarded-for")
    ?.split(",", 1)[0]
    ?.trim();
  const ip = forwardedIp || request.headers.get("x-real-ip")?.trim() || "unknown";

  return createHmac("sha256", secret).update(ip).digest("hex");
}
