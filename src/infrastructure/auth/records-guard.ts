export function getRecordsLoginRedirect(
  requestUrl: URL,
  authenticated: boolean,
): URL | null {
  if (authenticated) return null;

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("next", `${requestUrl.pathname}${requestUrl.search}`);
  return loginUrl;
}
