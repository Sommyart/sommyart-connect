import { useEffect, useState } from "react";

import { mediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

/** Renders a stored media path (private bucket) or a plain URL. */
export function Media({
  path,
  alt = "",
  className,
  video = false,
}: {
  path: string | null | undefined;
  alt?: string;
  className?: string;
  video?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void mediaUrl(path).then((next) => active && setUrl(next));
    return () => {
      active = false;
    };
  }, [path]);

  if (!url) return <div className={cn("bg-muted animate-pulse", className)} />;
  if (video) return <video src={url} controls playsInline className={className} />;
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}

export function Avatar({
  path,
  name,
  size = 40,
  className,
}: {
  path: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void mediaUrl(path).then((next) => active && setUrl(next));
    return () => {
      active = false;
    };
  }, [path]);

  const initials = name.trim().slice(0, 2).toUpperCase() || "SC";

  return url ? (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={cn(
        "bg-gradient-brand text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-extrabold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
