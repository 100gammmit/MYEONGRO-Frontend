interface LogoutDependencies {
  logout(request: Request): Promise<Response>;
}

export function createLogoutHandler(dependencies: LogoutDependencies) {
  return async function POST(request: Request): Promise<Response> {
    const backendResponse = await dependencies.logout(request);
    if (!backendResponse.ok) {
      return Response.json(
        {
          code: "LOGOUT_FAILED",
          message: "로그아웃을 완료하지 못했습니다.",
        },
        { status: 502 },
      );
    }

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
