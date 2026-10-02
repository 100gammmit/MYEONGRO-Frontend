import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound, { metadata } from "./not-found";

describe("NotFound", () => {
  it("explains the missing page in Korean and links back into the service", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요" }))
      .toBeInTheDocument();
    expect(screen.getByText(/삭제한 리딩 기록은 다시 열 수 없어요/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 가기" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "내 기록 보기" })).toHaveAttribute("href", "/records");
    expect(metadata.title).toBe("페이지를 찾을 수 없어요 | 명로");
  });
});
