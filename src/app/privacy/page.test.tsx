import { render, screen, within } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("describes the available account deletion control", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/계정 설정에서 저장한 리딩의 삭제, 계정 삭제와 AI 국외이전 동의 철회를 직접 할 수 있습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/운영 데이터베이스에서는 즉시 삭제되며 서비스에서 개별 복구할 수 없습니다.*재해복구용 자동 백업에는 최대 7일간 잔존/))
      .toBeInTheDocument();
    expect(screen.getByText("문서 버전 2026-10-31 · 시행일 2026-10-31")).toBeInTheDocument();
    expect(screen.getByText(/OpenAI OpCo, LLC의 Global API/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "개인정보 처리 항목과 보유기간" }))
      .toBeInTheDocument();
    const table = screen.getByRole("table", { name: "명로 개인정보 처리 항목과 보유기간" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent))
      .toEqual(["처리 목적", "처리 항목", "처리 근거", "보유기간·삭제 기준"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(14);
    const abuseLimitRow = within(table).getByRole("row", { name: /로그인 요청 남용 방지/ });
    expect(abuseLimitRow).toHaveTextContent("IP 주소 자체는 저장하지 않음");
    expect(abuseLimitRow).toHaveTextContent("1분 후 자동 삭제");
    const socialLoginRow = within(table).getByRole("row", { name: /소셜 로그인과 계정 식별/ });
    expect(socialLoginRow).toHaveTextContent("OAuth 제공자와 제공자 사용자 식별자");
    expect(socialLoginRow).not.toHaveTextContent("이메일");
    const sessionRow = within(table).getByRole("row", { name: /로그인과 가입 대기 세션/ });
    expect(sessionRow).toHaveTextContent("명로 사용자 식별자와 권한");
    expect(sessionRow).not.toHaveTextContent("이메일");
    expect(within(table).getByRole("row", { name: /사주 계산.*양력 생년월일.*처리 완료 시 폐기/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /AI 리딩 요청 처리.*명로 데이터베이스와 운영 로그에는 저장하지 않음/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /무료 오늘의 운세 이어보기.*SHA-256 계정 범위값.*현재 브라우저/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", {
      name: /개인정보 문의와 권리행사 처리.*발신자 이름·이메일 주소.*문의 처리를 완료한 날부터 최대 30일 이내/,
    })).toBeInTheDocument();
    const operationalLogRow = within(table).getByRole("row", {
      name: /서비스 보안과 오류·장애 대응.*리딩 식별자.*최대 30일/,
    });
    expect(operationalLogRow).toHaveTextContent("최대 30일 동안만 운영 조회·이용");
    expect(operationalLogRow).toHaveTextContent("CloudWatch 보유 정책에 따라 만료·삭제 대상으로 표시");
    expect(operationalLogRow).toHaveTextContent("물리적 삭제는 통상 추가 72시간 이내");
    expect(operationalLogRow).toHaveTextContent("드물게 더 오래 걸릴 수 있음");
    expect(within(table).getByRole("row", { name: /OpenAI를 통한 AI 리딩 생성.*국외이전 별도 동의.*최대 24시간/ }))
      .toBeInTheDocument();
    const directProcessorTable = screen.getByRole("table", {
      name: "명로가 직접 이용하는 개인정보 처리 수탁자",
    });
    expect(within(directProcessorTable).getByRole("row", {
      name: /Amazon Web Services Korea LLC.*Front 호스팅·콘텐츠 전송·API 요청 중계.*처리 항목별 보유기간/,
    })).toBeInTheDocument();
    expect(within(directProcessorTable).getByRole("row", {
      name: /OpenAI OpCo, LLC.*AI 타로·사주 리딩 생성.*OpenAI 국외이전/,
    })).toBeInTheDocument();
    expect(within(directProcessorTable).getAllByRole("rowheader").map((cell) => cell.textContent))
      .toEqual(["Amazon Web Services Korea LLC", "OpenAI OpCo, LLC", "Google Asia Pacific Pte. Ltd."]);
    expect(within(directProcessorTable).getByRole("row", {
      name: /Google Asia Pacific Pte. Ltd..*개인정보 문의 메일·첨부파일·답변.*Google 복구·삭제 기준/,
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AWS 인프라의 국외 처리" }))
      .toBeInTheDocument();
    expect(screen.getByText(/주된 Front 서버·Backend·세션·데이터베이스·운영 로그 처리 및 저장 위치는 대한민국 서울 리전/))
      .toBeInTheDocument();
    expect(screen.getAllByText(/개인정보 보호법 제28조의8 제1항 제3호 가목/))
      .toHaveLength(2);
    expect(screen.getByText(/서비스 이용 전에는 접속을 중단하고.*계정을 삭제하거나 개인정보 문의 이메일로 요청/))
      .toBeInTheDocument();
    expect(screen.getByText(/AWS 인프라는 명로 서비스 제공에 필수이므로.*웹 서비스 전체를 이용할 수 없음.*이메일을 통한 권리행사와 계정 삭제 요청은 가능/))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AWS의 현재 엣지 로케이션 목록" }))
      .toHaveAttribute("href", "https://aws.amazon.com/cloudfront/features/");
    expect(screen.getByRole("heading", { name: "개인정보 문의 이메일 국외 처리" }))
      .toBeInTheDocument();
    expect(screen.getByText(/Google Workspace에서 직접 수신·저장·회신.*개인 Gmail 전달은 사용하지 않음/))
      .toBeInTheDocument();
    expect(screen.getByText(/최대 25일의 관리자 복구 가능 기간.*고객이 복구할 수 없는 상태의 삭제 지시 후.*최대 180일/))
      .toBeInTheDocument();
    expect(screen.getByText(/메일 국외 처리를 거부하면 이메일을 통한 문의·권리행사는 처리할 수 없음/))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Google Workspace 개인정보 담당팀 문의" }))
      .toHaveAttribute("href", "https://support.google.com/a/contact/googlecloud_dpr");
    expect(screen.getByText(/Workspace 관리자 로그인 필요/)).toBeInTheDocument();
    expect(screen.getByText(/Business Starter에는 명로가 한국 저장 리전을 지정하지 않았습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/CDPA는 처리 계약이며 그 수락 자체가 국외이전의 법적 근거를 대신하지 않습니다/))
      .toBeInTheDocument();
    const mailProcessorTable = screen.getByRole("table", {
      name: "Google Workspace 문의 메일 처리 역할과 처리 가능 국가",
    });
    expect(within(mailProcessorTable).getAllByRole("rowheader")).toHaveLength(4);
    const maintenanceCells = within(within(mailProcessorTable).getByRole("row", {
      name: /서비스 유지보수/,
    })).getAllByRole("cell");
    expect(maintenanceCells[0]).not.toHaveTextContent("대한민국");
    expect(maintenanceCells[1]).toHaveTextContent("대한민국");
    expect(within(mailProcessorTable).getByRole("row", {
      name: /조건부 기술 지원.*콜롬비아.*명시적으로 허용/,
    })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Google Workspace 공식 하위처리자 목록" }))
      .toHaveAttribute("href", "https://workspace.google.com/intl/en/terms/subprocessors/");
    expect(screen.getByRole("link", { name: "Google Cloud 데이터 처리 부속약정(CDPA) 제6조" }))
      .toHaveAttribute("href", "https://cloud.google.com/terms/data-processing-addendum");
    const processorTable = screen.getByRole("table", {
      name: "OpenAI API 외부 처리자와 처리 가능 국가",
    });
    expect(within(processorTable).getByRole("row", {
      name: /직접 이전받는 자.*OpenAI OpCo, LLC.*미국/,
    })).toBeInTheDocument();
    expect(within(processorTable).getByRole("row", {
      name: /API 클라우드 인프라.*Microsoft Corporation.*대한민국/,
    })).toBeInTheDocument();
    expect(within(processorTable).getByRole("row", {
      name: /조건부 콘텐츠 검토·고객지원.*TaskUs, LLC.*필리핀/,
    })).toBeInTheDocument();
    expect(within(processorTable).getByRole("row", {
      name: /동적 네트워크 처리.*Cloudflare, Ltd..*가장 가까운 데이터센터 소재국/,
    })).toBeInTheDocument();
    expect(screen.getByText(/정적 처리 국가 수는 국내 위치를 포함해 26개/))
      .toBeInTheDocument();
    expect(screen.getByText(/Global API는 미국에서만 처리되는 서비스가 아니며/))
      .toBeInTheDocument();
    expect(screen.getByText(/store=false는 이러한 오남용 감시 로그와 프롬프트 캐시를 제거하지 않습니다/))
      .toBeInTheDocument();
    expect(screen.getAllByText(/서비스 또는 제3자를 위해로부터 보호하기 위해 합리적으로 필요한 경우 더 오래 보관/))
      .toHaveLength(2);
    expect(screen.getByText(/OpenAI 원문 갱신일 2026-07-09 · 명로 최종 확인일 2026-09-25/))
      .toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "개인정보 보호법 제15조 제1항 제4호" }))
      .toHaveLength(10);
    expect(screen.getByRole("link", { name: "개인정보 보호법 제28조의8 제1항 제1호" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "개인정보 파기 절차와 방법" }))
      .toBeInTheDocument();
    expect(screen.getByText(/운영 데이터베이스의 관련 레코드를 복구 유예 없이 영구 삭제/))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "로그인 세션 쿠키" }))
      .toBeInTheDocument();
    expect(screen.getByText(/MYEONGRO_SESSION/)).toBeInTheDocument();
    expect(screen.getByText(/HttpOnly, Secure와 SameSite=Lax/)).toBeInTheDocument();
    expect(screen.getByText(/광고 또는 행태 추적 쿠키를 사용하지 않/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "개인정보 보호책임자와 문의처" }))
      .toBeInTheDocument();
    expect(screen.getByText("백민하")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "privacy@myeongro.com" }))
      .toHaveLength(2);
    expect(screen.getByRole("link", { name: "개인정보분쟁조정위원회" }))
      .toHaveAttribute("href", "https://www.kopico.go.kr");
    expect(screen.getByRole("link", { name: "개인정보침해 신고센터" }))
      .toHaveAttribute("href", "https://privacy.kisa.or.kr");
    // The two links sit on separate JSX lines; the spaces around "또는" must survive.
    expect(screen.getByRole("link", { name: "개인정보분쟁조정위원회" }).closest("p"))
      .toHaveTextContent("개인정보분쟁조정위원회 또는 개인정보침해 신고센터를 이용할 수 있습니다.");
  });
});
