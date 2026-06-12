export async function POST() {
  return Response.json(
    { error: "Use POST /api/readings." },
    { status: 410 },
  );
}
