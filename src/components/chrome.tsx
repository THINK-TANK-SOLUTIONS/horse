import { Link, useRouterState } from "@tanstack/react-router";
import { HorseWordmark } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/studio", label: "Studio" },
  { to: "/library", label: "Library" },
  { to: "/stacks", label: "Stacks" },
  { to: "/monitor", label: "Monitor" },
] as const;

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <Link to="/" className="shrink-0 text-fg">
            <HorseWordmark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-sm px-3 py-2 text-sm transition-colors duration-150",
                  pathname === item.to ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/studio"
            className="inline-flex h-9 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Open studio
          </Link>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-bg md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex h-12 items-center justify-center text-xs",
              pathname === item.to ? "text-fg" : "text-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
