import { createFileRoute } from "@tanstack/react-router";
import { AppChrome } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { SHELVES, STACKS } from "@/lib/quant/presets";
import { useHorse } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stacks")({ component: StacksPage });

function StacksPage() {
  const installed = useHorse((s) => s.installed);
  const toggle = useHorse((s) => s.toggleStack);
  return (
    <AppChrome>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">STK_SHELF</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Setups that already know how.</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Install a stack for the venue you actually use. HORSE does not log into brokers. It
          compiles the file and keeps keys in this browser.
        </p>
        <div className="mt-12 space-y-10">
          {SHELVES.map((shelf) => (
            <section key={shelf}>
              <h2 className="text-xs uppercase tracking-[0.18em] text-subtle">{shelf}</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {STACKS.filter((s) => s.shelf === shelf).map((s) => {
                  const on = installed.includes(s.id);
                  return (
                    <article
                      key={s.id}
                      className={cn(
                        "rounded-lg border p-5",
                        on ? "border-border-strong bg-elevated" : "border-border bg-surface",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{s.name}</h3>
                          <p className="mt-1 text-sm text-muted">{s.blurb}</p>
                        </div>
                        <Button size="sm" variant={on ? "primary" : "outline"} onClick={() => toggle(s.id)}>
                          {on ? "Installed" : "Install"}
                        </Button>
                      </div>
                      <p className="mt-3 text-sm text-subtle">{s.detail}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
