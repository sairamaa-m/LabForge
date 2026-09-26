import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FlaskConical,
  Layers,
  BarChart3,
  Sparkles,
  Settings,
  Beaker,
} from "lucide-react";

const liveItems = [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }];

// These sections are part of the intended architecture (see phases 5, 6, 8)
// but have no page yet in Phase 1, so they render as inert placeholders
// rather than linking to a route that doesn't exist.
const upcomingItems = [
  { label: "Experiments", icon: FlaskConical },
  { label: "Presets", icon: Layers },
  { label: "Results", icon: BarChart3 },
  { label: "AI Assistant", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <Beaker className="h-5 w-5 text-signal" strokeWidth={2} />
        <span className="font-display text-[15px] font-semibold tracking-tight">
          ExperimentLab
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {liveItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-signal-soft text-signal-dark"
                  : "text-ink-soft hover:bg-black/[0.03] hover:text-ink"
              }`
            }
            end
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
        <div className="my-2 border-t border-line" />
        {upcomingItems.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex cursor-default items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink-soft/50"
            title="Coming in a later phase"
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </div>
        ))}
      </nav>
      <div className="border-t border-line px-5 py-4 text-xs text-ink-soft">
        Phase 1 — local data only
      </div>
    </aside>
  );
}
