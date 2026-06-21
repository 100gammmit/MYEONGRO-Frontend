import type { PublicReadingRecord } from "@/app/api/readings/records-handler";

interface ReadingRecordEnvelope {
  reading: PublicReadingRecord;
}

interface ReadingRecordsEnvelope {
  items: PublicReadingRecord[];
}

export class BackendReadingRecordsClient {
  private readonly baseUrl: string;

  constructor(baseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async list(accessToken: string): Promise<PublicReadingRecord[]> {
    const response = await this.request("/api/readings", accessToken);
    const body = await response.json() as ReadingRecordsEnvelope;
    return body.items;
  }

  async get(
    accessToken: string,
    readingId: string,
  ): Promise<PublicReadingRecord | null> {
    const response = await this.request(`/api/readings/${readingId}`, accessToken);
    if (response.status === 404) return null;
    const body = await response.json() as ReadingRecordEnvelope;
    return body.reading;
  }

  async softDelete(accessToken: string, readingId: string): Promise<boolean> {
    const response = await this.request(
      `/api/readings/${readingId}`,
      accessToken,
      { method: "DELETE" },
    );
    if (response.status === 404) return false;
    return response.status === 204;
  }

  async retry(
    accessToken: string,
    readingId: string,
  ): Promise<PublicReadingRecord> {
    const response = await this.request(
      `/api/readings/${readingId}/retry`,
      accessToken,
      { method: "POST" },
    );
    const body = await response.json() as ReadingRecordEnvelope;
    return body.reading;
  }

  private async request(
    path: string,
    accessToken: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (response.status === 404 || response.status === 204) {
      return response;
    }
    if (!response.ok) {
      throw new Error(`Backend reading records API failed: ${response.status}`);
    }
    return response;
  }
}
