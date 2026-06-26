interface LogoutDependencies {
  logout(request: Request): Promise<Response>;
}

export function createLogoutHandler(dependencies: LogoutDependencies) {
  return async function POST(request: Request): Promise<Response> {
    const backendResponse = await dependencies.logout(request);
    const response = new Response(null, {
      status: 303,
      headers: {
        location: new URL("/", request.url).toString(),
      },
    });
    const setCookie = backendResponse.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }
    return response;
  };
}
