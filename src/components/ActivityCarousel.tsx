import { CalendarDays } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DAY_NAMES, type Activity } from "@/lib/member-types";

export function ActivityCarousel({ activities }: { activities: Activity[] }) {
  const today = new Date().getDay();
  const ordered = [...activities].sort(
    (a, b) => ((a.day - today + 7) % 7) - ((b.day - today + 7) % 7),
  );

  return (
    <Carousel opts={{ align: "start", loop: true }} className="w-full">
      <CarouselContent className="-ml-3">
        {ordered.map((a) => (
          <CarouselItem key={a.id} className="basis-[85%] pl-3">
            <article
              className={`shadow-card flex h-full min-h-44 flex-col rounded-3xl p-5 ${
                a.day === today
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-card/85 text-card-foreground border-border/60 border backdrop-blur-xl"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] uppercase opacity-80">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {DAY_NAMES[a.day]}
                {a.day === today ? " • today" : ""}
              </div>
              <h3 className="mt-2 text-lg leading-snug font-extrabold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-90">{a.description}</p>
              {!a.is_active && (
                <span className="mt-3 self-start rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Paused
                </span>
              )}
            </article>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-1 hidden sm:flex" />
      <CarouselNext className="-right-1 hidden sm:flex" />
    </Carousel>
  );
}
