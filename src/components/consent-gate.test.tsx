import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConsentGate } from "./consent-gate";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ConsentGate", () => {
  it("shows a loading state while checking the current consent status", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => pending.promise);

    render(<ConsentGate onComplete={vi.fn()} />);

    expect(screen.getByText("동의 상태를 확인하고 있어요...")).toBeInTheDocument();

    pending.resolve(new Response(JSON.stringify({
      status: {
        acceptedDocumentTypes: [],
        requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
        hasAcceptedRequired: false,
      },
    }), { status: 200 }));

    await screen.findByRole("button", { name: "동의하고 계속" });
    fetchMock.mockRestore();
  });

  it("skips the gate when the current document version is already accepted", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        status: {
          acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
          requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
          hasAcceptedRequired: true,
        },
      }), { status: 200 }),
    );
    const onComplete = vi.fn();

    render(<ConsentGate onComplete={onComplete} />);

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(screen.queryByRole("button", { name: "동의하고 계속" })).not.toBeInTheDocument();
    fetchMock.mockRestore();
  });

  it("retries the initial status request after GET failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: {
          acceptedDocumentTypes: [],
          requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
          hasAcceptedRequired: false,
        },
      }), { status: 200 }));
    const onComplete = vi.fn();

    render(<ConsentGate onComplete={onComplete} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "동의 상태를 불러오지 못했어요. 다시 시도해주세요.",
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("button", { name: "동의하고 계속" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/consents");
    expect(onComplete).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("waits for POST success before continuing and allows retry after a failure", async () => {
    const submit = deferred<Response>();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: {
          acceptedDocumentTypes: [],
          requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
          hasAcceptedRequired: false,
        },
      }), { status: 200 }))
      .mockRejectedValueOnce(new Error("network"))
      .mockImplementationOnce(() => submit.promise);
    const onComplete = vi.fn();

    render(<ConsentGate onComplete={onComplete} />);

    for (const checkbox of await screen.findAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }

    fireEvent.click(screen.getByRole("button", { name: "동의하고 계속" }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "동의 저장에 실패했어요. 다시 시도해주세요.",
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(onComplete).not.toHaveBeenCalled();
    submit.resolve(new Response(JSON.stringify({ consents: [] }), { status: 200 }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/consents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
        }),
      }),
    );
    fetchMock.mockRestore();
  });
});
