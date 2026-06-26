import type { PublicReadingRecord } from "@/app/api/readings/records-handler";
import { toBackendUrl } from "./url";

interface ReadingRecordEnvelope {
  reading: PublicReadingRecord;
}

interface ReadingRecordsEnvelope {
  items: PublicReadingRecord[];
}

export class BackendReadingRecordsError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Backend reading records API failed: ${status}`);
  }
}

export class BackendReadingRecordsClient {
  constructor(private readonly cookieHeader?: string | null) {}

  async list(): Promise<PublicReadingRecord[]> {
    const response = await this.request("/api/readings");
    const body = await response.json() as ReadingRecordsEnvelope;
    return body.items;
  }

  async get(readingId: string): Promise<PublicReadingRecord | null> {
    const response = await this.request(`/api/readings/${readingId}`);
    if (response.status === 404) return null;
    const body = await response.json() as ReadingRecordEnvelope;
    return body.reading;
  }

  async softDelete(readingId: string): Promise<boolean> {
    const response = await this.request(
      `/api/readings/${readingId}`,
      { method: "DELETE" },
    );
    if (response.status === 404) return false;
    return response.status === 204;
  }

  async retry(readingId: string): Promise<PublicReadingRecord> {
    const response = await this.request(
      `/api/readings/${readingId}/retry`,
      { method: "POST" },
      { allowNotFound: false },
    );
    const body = await response.json() as ReadingRecordEnvelope;
    return body.reading;
  }

  private async request(
    path: string,
    init: RequestInit = {},
    options: { allowNotFound?: boolean } = {},
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.cookieHeader) {
      headers.set("cookie", this.cookieHeader);
    }

    const response = await fetch(toBackendUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
    if ((options.allowNotFound !== false && response.status === 404)
      || response.status === 204) {
      return response;
    }
    if (!response.ok) {
      throw new BackendReadingRecordsError(
        response.status,
        await readErrorBody(response),
      );
    }
    return response;
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { error: "Backend reading records API failed" };
  }
}
