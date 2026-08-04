import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Sign in for today — one per calendar day, never in the past or future. */
export const signInToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { signIn } = await import("./checkin.server");
    return signIn(context.userId);
  });

/** Streak, totals and the dates the caller has signed in. */
export const getСheckInStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { stats } = await import("./checkin.server");
    return stats(context.userId);
  });
