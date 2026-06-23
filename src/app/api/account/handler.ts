export interface AccountDeleteDependencies {
  getUserId(): Promise<string | null>;
  deleteUser(userId: string): Promise<void>;
  signOut(): Promise<void>;
  clearLocalAuthCookies(): Promise<void>;
}

const ACCOUNT_DELETE_ERROR =
  "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export function createAccountDeleteHandler(dependencies: AccountDeleteDependencies) {
  return async function DELETE(): Promise<Response> {
    const userId = await dependencies.getUserId();
    if (!userId) {
      return Response.json(
        { code: "UNAUTHENTICATED", message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }
    try {
      await dependencies.deleteUser(userId);
    } catch {
      return Response.json(
        { code: "ACCOUNT_DELETE_FAILED", message: ACCOUNT_DELETE_ERROR },
        { status: 500 },
      );
    }

    try {
      await dependencies.signOut();
    } catch {
      // The account no longer exists; local cookie expiry is authoritative here.
    }
    try {
      await dependencies.clearLocalAuthCookies();
    } catch {
      // Deletion is irreversible; cleanup failures must not report it as failed.
    }
    return new Response(null, { status: 204 });
  };
}
