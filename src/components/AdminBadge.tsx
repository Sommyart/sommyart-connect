import { ShieldCheck } from "lucide-react";

export function AdminBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
      title="Verified admin"
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      {!compact && "Admin"}
    </span>
  );
}