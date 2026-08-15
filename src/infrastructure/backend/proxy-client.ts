import { toBackendUrl } from "./url";

const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "cookie",
  "x-forwarded-for",
  "x-real-ip",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "set-cookie",
] as const;

const SPRING_SESSION_COOKIE_NAMES = new Set([
  "MYEONGRO_SESSION",
  "JSESSIONID",
  "SESSION",
]);

export async function proxyBackendRequest(input: {
  request: Request;
  path: string;
}): Promise<Response> {
  try {
    const response = await fetch(toBackendUrl(input.path), {
      method: input.request.method,
      headers: createBackendHeaders(input.request),
      body: await getRequestBody(input.request),
      cache: "no-store",
    });

    const body = responseMustNotHaveBody(response.status)
      ? null
      : await response.arrayBuffer();

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: createResponseHeaders(response),
    });
  } catch {
    return Response.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "요청을 처리할 서버에 연결하지 못했습니다.",
      },
      { status: 502 },
    );
  }
}

function responseMustNotHaveBody(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}

function createBackendHeaders(request: Request): HeadersInit {
  const headers: Record<string, string> = {};
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (!value) continue;
    if (name === "cookie") {
      const sessionCookie = getSpringSessionCookie(value);
      if (sessionCookie) headers[name] = sessionCookie;
      continue;
    }
    headers[name] = value;
  }
  return headers;
}

function getSpringSessionCookie(cookieHeader: string): string | null {
  const sessionCookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => SPRING_SESSION_COOKIE_NAMES.has(cookie.split("=", 1)[0] ?? ""));
  return sessionCookies.length > 0 ? sessionCookies.join("; ") : null;
}

async function getRequestBody(request: Request): Promise<string | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  return request.text();
}

function createResponseHeaders(response: Response): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}
