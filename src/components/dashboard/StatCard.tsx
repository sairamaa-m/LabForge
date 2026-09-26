import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export default function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        <Icon className="h-4 w-4 text-ink-soft" strokeWidth={2} />
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
