"use client";

export function ProtectedPageUnavailable() {
  return (
    <section className="simple-page page-width">
      <div className="wizard-card" role="alert">
        <h1>페이지를 불러오지 못했어요</h1>
        <p>잠시 후 다시 시도해 주세요.</p>
        <button className="secondary-button narrow-button" onClick={() => window.location.reload()} type="button">
          다시 시도
        </button>
      </div>
    </section>
  );
}
