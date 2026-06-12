import { describe, expect, it, vi } from "vitest";

import { SupabaseConsentRepository } from "./consent-repository";

function createQueryMock(data: unknown) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data, error: null }),
  };

  return query;
}

describe("SupabaseConsentRepository", () => {
  it("returns accepted_at from the database after a successful RPC", async () => {
    const query = createQueryMock([
      {
        document_type: "terms",
        document_version: "2026-06-10",
        accepted_at: "2026-06-11T00:00:00.000Z",
      },
      {
        document_type: "privacy",
        document_version: "2026-06-10",
        accepted_at: "2026-06-11T00:00:01.000Z",
      },
    ]);
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn().mockReturnValue(query),
    };
    const repository = new SupabaseConsentRepository(client as never);

    await expect(repository.upsertMany([
      {
        subjectId: "user-1",
        subjectType: "user",
        documentType: "terms",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-10T00:00:00.000Z",
      },
      {
        subjectId: "user-1",
        subjectType: "user",
        documentType: "privacy",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-10T00:00:00.000Z",
      },
    ])).resolves.toEqual([
      {
        subjectId: "user-1",
        subjectType: "user",
        documentType: "terms",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-11T00:00:00.000Z",
      },
      {
        subjectId: "user-1",
        subjectType: "user",
        documentType: "privacy",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-11T00:00:01.000Z",
      },
    ]);

    expect(client.rpc).toHaveBeenCalledWith("record_required_consents", {
      requested_user_id: "user-1",
      requested_guest_session_id: null,
      requested_document_types: ["terms", "privacy"],
      requested_document_versions: ["2026-06-10", "2026-06-10"],
      requested_accepted_at: "2026-06-10T00:00:00.000Z",
    });
    expect(client.from).toHaveBeenCalledWith("consents");
    expect(query.select).toHaveBeenCalledWith("document_type, document_version, accepted_at");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.in).toHaveBeenCalledWith("document_type", ["terms", "privacy"]);
  });

  it("returns an empty array without calling the database when no consents are provided", async () => {
    const client = {
      rpc: vi.fn(),
      from: vi.fn(),
    };
    const repository = new SupabaseConsentRepository(client as never);

    await expect(repository.upsertMany([])).resolves.toEqual([]);

    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("preserves the RPC error without issuing a follow-up query", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
      from: vi.fn(),
    };
    const repository = new SupabaseConsentRepository(client as never);

    await expect(repository.upsertMany([
      {
        subjectId: "guest-1",
        subjectType: "guest",
        documentType: "terms",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-10T00:00:00.000Z",
      },
    ])).rejects.toThrow("Failed to record consent: boom");

    expect(client.from).not.toHaveBeenCalled();
  });
});
