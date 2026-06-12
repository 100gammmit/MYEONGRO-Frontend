import { createGuestTransferPostHandler } from "./handler";

export async function POST(request: Request) {
  return createGuestTransferPostHandler()(request);
}
