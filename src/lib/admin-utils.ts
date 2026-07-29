export function lagosTodayClient(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function monthRange(date: string) {
  const [y, m] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(last)}`, year: y, month: m };
}

export function downloadCsv(filename: string, head: string[], rows: (string | number)[][]) {
  const csv = [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const CONTRIBUTION_STATUSES = ["paid", "pending", "not_paid"] as const;
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];

export const STATUS_LABEL: Record<ContributionStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  not_paid: "Not paid",
};
