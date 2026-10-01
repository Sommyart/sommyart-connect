import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Media } from "@/components/Media";
import { cn } from "@/lib/utils";

/**
 * Swipeable multi-image carousel with position counter, indicator dots and a
 * full-screen lightbox viewer with prev/next navigation.
 */
export function MediaCarousel({
  paths,
  alt = "Post media",
}: {
  paths: string[];
  alt?: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);

  if (paths.length === 0) return null;

  const goTo = (target: number, ref?: React.RefObject<HTMLDivElement | null>) => {
    const clamped = Math.max(0, Math.min(paths.length - 1, target));
    setIndex(clamped);
    ref?.current?.scrollTo({ left: clamped * ref.current.clientWidth, behavior: "smooth" });
  };

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) setIndex(next);
  };

  return (
    <div className="group/carousel relative">
      <div
        ref={trackRef}
        className="bg-muted flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={() => handleScroll(trackRef)}
      >
        {paths.map((path, i) => (
          <button
            key={path}
            type="button"
            className="min-w-full snap-center"
            onClick={() => setLightbox(true)}
            aria-label={`Open image ${i + 1} of ${paths.length}`}
          >
            <Media
              path={path}
              alt={`${alt} ${i + 1}`}
              className="max-h-[26rem] w-full object-cover"
            />
          </button>
        ))}
      </div>

      {paths.length > 1 && (
        <>
          <span className="bg-foreground/70 text-background absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums">
            {index + 1} / {paths.length}
          </span>

          {/* Desktop arrows */}
          <button
            type="button"
            aria-label="Previous image"
            className="bg-background/80 text-foreground absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full p-2 shadow-md transition-opacity group-hover/carousel:opacity-100 md:block"
            onClick={() => goTo(index - 1, trackRef)}
            style={{ opacity: index === 0 ? 0 : undefined, pointerEvents: index === 0 ? "none" : undefined }}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="bg-background/80 text-foreground absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full p-2 shadow-md transition-opacity group-hover/carousel:opacity-100 md:block"
            onClick={() => goTo(index + 1, trackRef)}
            style={{ opacity: index === paths.length - 1 ? 0 : undefined, pointerEvents: index === paths.length - 1 ? "none" : undefined }}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            {paths.map((path, i) => (
              <button
                key={path}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "bg-primary w-5" : "bg-muted-foreground/30 w-1.5",
                )}
                onClick={() => goTo(i, trackRef)}
              />
            ))}
          </div>
        </>
      )}

      {/* Full-screen viewer */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-bold tabular-nums">
              {index + 1} / {paths.length}
            </span>
            <button
              type="button"
              aria-label="Close viewer"
              className="rounded-full bg-white/10 p-2.5 transition-colors hover:bg-white/20"
              onClick={() => setLightbox(false)}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div
            ref={lightboxTrackRef}
            className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={() => handleScroll(lightboxTrackRef)}
          >
            {paths.map((path) => (
              <div key={path} className="flex min-w-full snap-center items-center justify-center p-2">
                <Media path={path} alt={alt} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>

          {paths.length > 1 && (
            <div className="flex items-center justify-center gap-6 p-5">
              <button
                type="button"
                aria-label="Previous image"
                className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                onClick={() => goTo(index - 1, lightboxTrackRef)}
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
              <div className="flex items-center gap-2">
                {paths.map((path, i) => (
                  <button
                    key={path}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index ? "bg-white w-5" : "bg-white/30 w-1.5",
                    )}
                    onClick={() => goTo(i, lightboxTrackRef)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next image"
                className="rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                onClick={() => goTo(index + 1, lightboxTrackRef)}
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
