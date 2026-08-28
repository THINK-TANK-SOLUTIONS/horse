import { cn } from "@/lib/utils";

export function HorseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-fg", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M8 27V13.5a8 8 0 0 1 16 0V27h-5V14.2a3 3 0 0 0-6 0V27H8z"
      />
    </svg>
  );
}

export function HorseWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <HorseMark className="size-6" />
      <span className="font-display text-xl tracking-tight">HORSE</span>
    </span>
  );
}
