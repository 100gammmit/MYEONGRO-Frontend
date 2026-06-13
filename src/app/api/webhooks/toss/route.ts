export async function POST() {
  return Response.json(
    { error: "결제 기능은 준비 중입니다." },
    { status: 410 },
  );
}
