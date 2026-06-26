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

    return new Response(await response.arrayBuffer(), {
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

function createBackendHeaders(request: Request): HeadersInit {
  const headers: Record<string, string> = {};
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
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
