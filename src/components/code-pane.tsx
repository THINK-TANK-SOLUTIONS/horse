import { useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CodePane({
  value,
  filename,
  onCopy,
  className,
}: {
  value: string;
  filename: string;
  onCopy?: () => void;
  className?: string;
}) {
  const lines = useMemo(() => value.replace(/\n$/, "").split("\n"), [value]);
  const gutter = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      onCopy?.();
    } catch {
      onCopy?.();
    }
  }

  return (
    <div className={cn("flex min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-md border border-border bg-surface", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <span className="truncate font-mono text-xs text-muted">{filename}</span>
        <Button size="sm" variant="outline" onClick={copy}>
          Copy
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          ref={gutter}
          className="w-10 shrink-0 overflow-hidden border-r border-border bg-elevated py-3 text-right font-mono text-[11px] leading-5 text-subtle"
          aria-hidden
        >
          {lines.map((_, i) => (
            <div key={i} className="pr-2">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={body}
          readOnly
          value={value}
          spellCheck={false}
          onScroll={(e) => {
            if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
          }}
          className="min-h-[280px] min-w-0 w-full flex-1 resize-none overflow-auto bg-transparent p-3 font-mono text-[12px] leading-5 text-fg outline-none"
        />
      </div>
    </div>
  );
}
