import { useEffect, useState } from "react";
import { Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getPictureUrl } from "@/lib/members";
import type { BusinessPost } from "@/hooks/use-business";

function Thumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getPictureUrl(path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [path]);
  return url ? (
    <img src={url} alt="" className="h-12 w-12 rounded-xl object-cover" />
  ) : (
    <div className="bg-muted h-12 w-12 animate-pulse rounded-xl" />
  );
}

export function BusinessPostsPanel() {
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("business_posts")
        .select("id,member_nickname,member_image,business_name,caption,images,post_date")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setPosts((data ?? []) as BusinessPost[]);
      setLoading(false);
    })();
  }, []);

  async function remove(id: string) {
    const { error } = await supabase.from("business_posts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPosts((p) => p.filter((x) => x.id !== id));
    toast.success("Post removed");
  }

  return (
    <section className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
      <h2 className="text-card-foreground flex items-center gap-2 font-bold">
        <Store className="text-primary h-5 w-5" aria-hidden /> Business Spotlight ({posts.length})
      </h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Members can post up to 3 pictures every Tuesday.
      </p>
      <div className="mt-3 space-y-2">
        {loading && <div className="bg-muted h-16 animate-pulse rounded-2xl" />}
        {!loading && posts.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">No business posts yet.</p>
        )}
        {posts.map((p) => (
          <div key={p.id} className="bg-secondary flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="flex gap-1">
              {p.images.slice(0, 3).map((img) => (
                <Thumb key={img} path={img} />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-secondary-foreground truncate text-sm font-semibold">
                {p.business_name ?? "Business"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {p.member_nickname} • {new Date(`${p.post_date}T12:00:00Z`).toLocaleDateString()}
              </p>
            </div>
            <button
              aria-label="Delete business post"
              className="press text-muted-foreground hover:text-destructive p-2"
              onClick={() => void remove(p.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
