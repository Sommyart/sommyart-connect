import { cn } from "@/lib/utils";

export function Logo({ className, size = 96 }: { className?: string; size?: number }) {
  return (
    <img
      src="/icons/logo.png"
      alt="AWKA CONNECT logo"
      width={size}
      height={size}
      className={cn("select-none object-contain", className)}
    />
  );
}
