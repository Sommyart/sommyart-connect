import { Megaphone } from "lucide-react";

export function AnnouncementBanner({ message, loading }: { message?: string; loading?: boolean }) {
  if (loading) {
    return <div className="h-14 w-full animate-pulse rounded-3xl bg-muted" />;
  }
  if (!message) return null;

  return (
    <div className="bg-gradient-brand shadow-glow relative flex h-14 w-full items-center overflow-hidden rounded-3xl">
      <div className="bg-primary/90 text-primary-foreground z-10 flex h-full items-center gap-2 rounded-l-3xl px-4">
        <Megaphone className="h-5 w-5" aria-hidden />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-marquee flex w-max gap-16 pl-6 whitespace-nowrap">
          <span className="text-primary-foreground text-sm font-semibold">{message}</span>
          <span className="text-primary-foreground text-sm font-semibold" aria-hidden>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
