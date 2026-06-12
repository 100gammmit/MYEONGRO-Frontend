import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";
import { createLogoutHandler } from "./handler";

export async function POST(request: Request) {
  return createLogoutHandler({
    signOut: async () => {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  })(request);
}
