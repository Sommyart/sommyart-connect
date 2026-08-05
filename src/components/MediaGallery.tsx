import { useState } from "react";

import { Media } from "@/components/Media";
import { Button } from "@/components/ui/button";
import { useMemberMedia, type GalleryItem } from "@/hooks/use-feed";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "photo", label: "Photos" },
  { key: "project", label: "Projects" },
  { key: "video", label: "Videos" },
] as const;

/** Grid of every photo, project cover and video a member has shared. */
export function MediaGallery({ userId }: { userId: string }) {
  const { data: items = [], isLoading } = useMemberMedia(userId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const visible: GalleryItem[] = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <h2 className="text-card-foreground text-lg font-extrabold">Media gallery</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "secondary"}
            className="press rounded-xl"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading && <div className="bg-muted mt-4 h-32 animate-pulse rounded-2xl" />}
      {!isLoading && visible.length === 0 && (
        <p className="text-muted-foreground mt-4 text-sm">Nothing here yet — share a post or a project.</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {visible.map((item) => (
          <Media
            key={item.id}
            path={item.path}
            alt={item.title}
            video={item.kind === "video"}
            className="aspect-square w-full rounded-2xl object-cover"
          />
        ))}
      </div>
    </section>
  );
}
