import { useEffect, useMemo, useState } from "react";
import { Store } from "lucide-react";

import { getPictureUrl } from "@/lib/members";
import type { BusinessPost } from "@/hooks/use-business";

function lagosDay() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short",
  }).format(new Date());
  return parts;
}

export function TuesdayHero({ posts }: { posts: BusinessPost[] }) {
  const isTuesday = lagosDay() === "Tue";
  const [slides, setSlides] = useState<{ url: string; who: string; name: string }[]>([]);
  const [index, setIndex] = useState(0);

  const flat = useMemo(
    () =>
      posts.flatMap((p) =>
        p.images.map((img) => ({
          path: img,
          who: p.member_nickname,
          name: p.business_name ?? "Business spotlight",
        })),
      ),
    [posts],
  );

  useEffect(() => {
    let active = true;
    Promise.all(
      flat.slice(0, 12).map(async (f) => ({ ...f, url: await getPictureUrl(f.path) })),
    ).then((res) => {
      if (active)
        setSlides(
          res
            .filter((r) => r.url)
            .map((r) => ({ url: r.url as string, who: r.who, name: r.name })),
        );
    });
    return () => {
      active = false;
    };
  }, [flat]);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!isTuesday) return null;

  const slide = slides[index];

  return (
    <section className="animate-fade-up shadow-card relative mb-4 overflow-hidden rounded-3xl">
      <div className="bg-gradient-brand text-primary-foreground flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-widest uppercase">
        <Store className="h-4 w-4" aria-hidden /> Tuesday Business Spotlight
      </div>

      {slide ? (
        <div className="relative aspect-[16/10] w-full">
          {slides.map((s, i) => (
            <img
              key={s.url}
              src={s.url}
              alt={`${s.name} by ${s.who}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4">
            <p className="text-sm font-extrabold text-white">{slide.name}</p>
            <p className="text-xs font-semibold text-white/85">Posted by {slide.who}</p>
          </div>
          <div className="absolute right-3 bottom-3 flex gap-1">
            {slides.map((s, i) => (
              <span
                key={s.url}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "bg-white w-4" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card/85 text-muted-foreground border-border/60 border-t p-6 text-center text-sm">
          It's Tuesday! Post 3 photos of your business to appear in this hero.
        </div>
      )}
    </section>
  );
}
