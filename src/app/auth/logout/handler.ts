interface LogoutDependencies {
  signOut(): Promise<void>;
}

export function createLogoutHandler(dependencies: LogoutDependencies) {
  return async function POST(request: Request): Promise<Response> {
    await dependencies.signOut();
    return Response.redirect(new URL("/", request.url), 303);
  };
}
