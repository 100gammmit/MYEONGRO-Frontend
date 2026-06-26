import { cookies } from "next/headers";

export async function getBackendCookieHeader(): Promise<string> {
  return (await cookies())
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}
