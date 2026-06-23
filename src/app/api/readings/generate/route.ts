export async function POST() {
  return Response.json(
    {
      code: "READING_GENERATE_ROUTE_GONE",
      message: "POST /api/readings를 사용해 주세요.",
    },
    { status: 410 },
  );
}
