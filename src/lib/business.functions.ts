import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TUESDAY = 2;

/** Weekday (0=Sun) in Africa/Lagos. */
function lagosWeekday(): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export const getBusinessWindow = createServerFn({ method: "GET" }).handler(async () => {
  return { open: lagosWeekday() === TUESDAY };
});

export const createBusinessPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(1),
        business_name: z.string().trim().min(2).max(80),
        caption: z.string().trim().max(300).optional(),
        images: z.array(z.string().trim().min(1).max(300)).min(1).max(3),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (lagosWeekday() !== TUESDAY)
      throw new Error("Business Spotlight posting is only open on Tuesdays.");

    const { memberForToken, supabaseAdmin } = await import("./auth.server");
    const { lagosToday } = await import("./attendance.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Your session has expired. Please log in again.");

    const today = lagosToday();
    const { count } = await supabaseAdmin
      .from("business_posts")
      .select("id", { count: "exact", head: true })
      .eq("member_id", me.id)
      .eq("post_date", today);
    if ((count ?? 0) > 0) throw new Error("You have already posted your business today.");

    const { error } = await supabaseAdmin.from("business_posts").insert({
      member_id: me.id,
      member_nickname: me.nickname,
      member_image: me.profile_picture,
      business_name: data.business_name,
      caption: data.caption?.trim() || null,
      images: data.images,
      post_date: today,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
