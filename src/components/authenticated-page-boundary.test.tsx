import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

import { AuthenticatedPageBoundary } from "./authenticated-page-boundary";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("AuthenticatedPageBoundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigation.push.mockReset();
    navigation.refresh.mockReset();
    window.history.replaceState({}, "", "/account?from=settings");
  });

  it("keeps the protected body hidden until /api/me authenticates the session", async () => {
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => pending.promise);

    render(
      <AuthenticatedPageBoundary>
        <p>보호된 계정 본문</p>
      </AuthenticatedPageBoundary>,
    );

    expect(screen.queryByText("보호된 계정 본문")).not.toBeInTheDocument();
    expect(screen.queryByText(/로그인.*확인/)).not.toBeInTheDocument();

    pending.resolve(Response.json({
      authenticated: true,
      user: { id: "user-1" },
    }));

    expect(await screen.findByText("보호된 계정 본문")).toBeInTheDocument();
  });

  it.each([
    Response.json({ authenticated: false }),
    Response.json({ code: "UNAUTHENTICATED" }, { status: 401 }),
  ])("redirects an unauthenticated response without revealing the body", async (response) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

    render(
      <AuthenticatedPageBoundary>
        <p>보호된 계정 본문</p>
      </AuthenticatedPageBoundary>,
    );

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/login?next=%2Faccount%3Ffrom%3Dsettings",
    ));
    expect(screen.queryByText("보호된 계정 본문")).not.toBeInTheDocument();
  });

  it("shows only a generic retry message after an authentication service failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ code: "BACKEND_UNAVAILABLE" }, { status: 502 }))
      .mockResolvedValueOnce(Response.json({ authenticated: true, user: { id: "user-1" } }));

    render(
      <AuthenticatedPageBoundary>
        <p>보호된 계정 본문</p>
      </AuthenticatedPageBoundary>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(screen.queryByText(/로그인 상태|서버 연결|api\/me/i)).not.toBeInTheDocument();
    expect(screen.queryByText("보호된 계정 본문")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("보호된 계정 본문")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(navigation.refresh).toHaveBeenCalledOnce();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
