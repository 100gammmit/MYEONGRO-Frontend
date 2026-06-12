import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { getAuthenticatedUserId } from "@/infrastructure/supabase/auth";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";
import { cookies } from "next/headers";
import { clearSupabaseAuthCookies } from "./auth-cookies";
import { createAccountDeleteHandler } from "./handler";

export async function DELETE() {
  return createAccountDeleteHandler({
    getUserId: getAuthenticatedUserId,
    deleteUser: async (userId) => {
      const { error } = await createAdminSupabaseClient().auth.admin.deleteUser(userId);
      if (error) throw new Error(`Failed to delete account: ${error.message}`);
    },
    signOut: async () => {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(`Failed to clear session: ${error.message}`);
    },
    clearLocalAuthCookies: async () => {
      clearSupabaseAuthCookies(await cookies());
    },
  })();
}
