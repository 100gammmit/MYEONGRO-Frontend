import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

const GUEST_COOKIE_NAME = "myeongro_guest";
const LEGACY_GUEST_COOKIE_NAME = "woondam_guest";
const MIN_SECRET_BYTES = 32;

interface GuestSessionPayload {
  sessionId: string;
  expiresAt: string;
}

export interface SignedGuestSession extends GuestSessionPayload {
  token: string;
}

export interface ResolvedGuestSessionCookie {
  session: GuestSessionPayload;
  token: string;
  migrationCookies: string[];
}

function assertSigningSecret(secret: string): void {
  if (Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES) {
    throw new Error("APP_SIGNING_SECRET must be at least 32 bytes");
  }
}

export function requireAppSigningSecret(
  rawSecret: string | undefined = process.env.APP_SIGNING_SECRET,
): string {
  const secret = rawSecret?.trim() ?? "";
  assertSigningSecret(secret);
  return secret;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidExpiry(value: string): boolean {
  const expiresAt = new Date(value);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.toISOString() === value;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(secret: string, payload: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

function createCookieString(
  name: string,
  value: string,
  options: {
    expires?: string;
    maxAge?: number;
    secure?: boolean;
  },
): string {
  const parts = [
    `${name}=${value}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
  ];

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.expires) {
    parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  }
  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function createSignedGuestSession(input: GuestSessionPayload & { secret: string }): SignedGuestSession {
  assertSigningSecret(input.secret);
  if (!isUuid(input.sessionId)) {
    throw new Error("Guest session ID must be a UUID");
  }
  if (!isValidExpiry(input.expiresAt)) {
    throw new Error("Guest session expiresAt must be a valid ISO timestamp");
  }

  const payload = JSON.stringify({
    sessionId: input.sessionId,
    expiresAt: input.expiresAt,
  });
  const encodedPayload = toBase64Url(payload);
  const signature = signPayload(input.secret, encodedPayload).toString("base64url");

  return {
    sessionId: input.sessionId,
    expiresAt: input.expiresAt,
    token: `${encodedPayload}.${signature}`,
  };
}

export function verifySignedGuestSession(input: {
  secret: string;
  token: string;
  now?: Date;
}): GuestSessionPayload | null {
  assertSigningSecret(input.secret);

  const [encodedPayload, encodedSignature, ...rest] = input.token.split(".");
  if (!encodedPayload || !encodedSignature || rest.length > 0) {
    return null;
  }

  const expectedSignature = signPayload(input.secret, encodedPayload);
  const actualSignature = Buffer.from(encodedSignature, "base64url");

  if (actualSignature.length !== expectedSignature.length) {
    return null;
  }
  if (!timingSafeEqual(actualSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<GuestSessionPayload>;
    if (!payload.sessionId || !payload.expiresAt) {
      return null;
    }
    if (!isUuid(payload.sessionId) || !isValidExpiry(payload.expiresAt)) {
      return null;
    }

    const now = input.now ?? new Date();
    if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
      return null;
    }

    return {
      sessionId: payload.sessionId,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export function createGuestSessionForNow(input: {
  secret: string;
  now?: Date;
  ttlMs?: number;
}): SignedGuestSession {
  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? 1000 * 60 * 60 * 24 * 30;
  return createSignedGuestSession({
    secret: input.secret,
    sessionId: randomUUID(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  });
}

export function serializeGuestSessionCookie(
  session: SignedGuestSession,
  options?: { secure?: boolean },
): string {
  return createCookieString(GUEST_COOKIE_NAME, session.token, {
    expires: session.expiresAt,
    secure: options?.secure ?? false,
  });
}

export function serializeExpiredGuestSessionCookie(options?: { secure?: boolean }): string {
  return createCookieString(GUEST_COOKIE_NAME, "", {
    expires: new Date(0).toISOString(),
    maxAge: 0,
    secure: options?.secure ?? false,
  });
}

export function serializeExpiredLegacyGuestSessionCookie(
  options?: { secure?: boolean },
): string {
  return createCookieString(LEGACY_GUEST_COOKIE_NAME, "", {
    expires: new Date(0).toISOString(),
    maxAge: 0,
    secure: options?.secure ?? false,
  });
}

export function getGuestSessionCookieName(): string {
  return GUEST_COOKIE_NAME;
}

export function getLegacyGuestSessionCookieName(): string {
  return LEGACY_GUEST_COOKIE_NAME;
}

export function resolveSignedGuestSessionCookie(input: {
  cookieHeader: string | null;
  secret: string;
  now?: Date;
  secure?: boolean;
}): ResolvedGuestSessionCookie | null {
  const currentToken = readCookie(input.cookieHeader, GUEST_COOKIE_NAME);
  if (currentToken) {
    const session = verifySignedGuestSession({
      secret: input.secret,
      token: currentToken,
      now: input.now,
    });
    if (session) {
      return { session, token: currentToken, migrationCookies: [] };
    }
  }

  const legacyToken = readCookie(
    input.cookieHeader,
    LEGACY_GUEST_COOKIE_NAME,
  );
  if (!legacyToken) return null;

  const session = verifySignedGuestSession({
    secret: input.secret,
    token: legacyToken,
    now: input.now,
  });
  if (!session) return null;

  return {
    session,
    token: legacyToken,
    migrationCookies: [
      serializeGuestSessionCookie(
        { ...session, token: legacyToken },
        { secure: input.secure ?? false },
      ),
      serializeExpiredLegacyGuestSessionCookie({
        secure: input.secure ?? false,
      }),
    ],
  };
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = part.trim().split("=");
    if (cookieName === name) return valueParts.join("=");
  }
  return null;
}
