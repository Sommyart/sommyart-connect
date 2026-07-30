import { Link } from "@tanstack/react-router";

export function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-10 flex flex-col items-center gap-1 pb-4 text-center ${className}`}>
      <p className="text-foreground text-sm font-extrabold tracking-wide">AWKA CONNECT</p>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
        Connect • Engage • Grow
      </p>
      <p className="text-muted-foreground text-[11px]">Version 1.0</p>
      <Link
        to="/admin"
        className="text-primary mt-1 text-xs font-semibold hover:underline"
        aria-label="Admin login"
      >
        🔐 Admin Login
      </Link>
      <p className="text-muted-foreground text-[10px]">Admin access only.</p>
    </footer>
  );
}
