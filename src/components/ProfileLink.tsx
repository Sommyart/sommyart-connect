import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/** Wraps a name/avatar so tapping it opens that member's public profile. */
export function ProfileLink({
  username,
  children,
  className,
}: {
  username: string | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  if (!username) return <span className={className}>{children}</span>;
  return (
    <Link to="/u/$username" params={{ username }} className={className} onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  );
}
