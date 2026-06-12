export function createGuestTransferPostHandler() {
  return async function POST(request: Request): Promise<Response> {
    void request;
    return new Response(null, { status: 410 });
  };
}
