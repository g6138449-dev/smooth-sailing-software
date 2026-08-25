import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Apple-Weather-style bento grid. */
export function Bento({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>
  );
}

/**
 * A single frosted bento tile: small uppercase caption with icon,
 * a large value, and supporting copy — mirroring the reference layout.
 */
export function Tile({
  icon: Icon,
  caption,
  children,
  className,
  span,
}: {
  icon?: LucideIcon;
  caption: string;
  children: ReactNode;
  className?: string;
  span?: "full" | "two";
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-3xl border border-border bg-card/70 p-4 backdrop-blur-xl",
        span === "full" && "sm:col-span-2 xl:col-span-3",
        span === "two" && "sm:col-span-2",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
        {caption}
      </p>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

/** Big numeric readout with optional unit and note, as in the reference cards. */
export function BigValue({
  value,
  unit,
  headline,
  note,
  tone,
}: {
  value: string | number;
  unit?: string;
  headline?: string;
  note?: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <p className={cn("font-num text-4xl leading-none tracking-tight", tone)}>
        {value}
        {unit ? <span className="ml-1 text-xl text-muted-foreground">{unit}</span> : null}
      </p>
      {headline ? (
        <p className="mt-1 text-sm font-semibold text-foreground">{headline}</p>
      ) : null}
      {note ? <p className="mt-auto pt-3 text-sm text-muted-foreground">{note}</p> : null}
    </div>
  );
}

/** Label/value rows separated by hairlines, like the Wind and Moon cards. */
export function TileRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-3 py-2">
          <dt className="text-sm text-foreground">{r.label}</dt>
          <dd className="font-num text-sm text-muted-foreground">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Semi-circular dial used for pressure / wind style readouts. */
export function Dial({
  value,
  min,
  max,
  label,
  unit,
  minLabel = "Low",
  maxLabel = "High",
}: {
  value: number;
  min: number;
  max: number;
  label?: string;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
}) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const ticks = 40;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-40">
        {Array.from({ length: ticks }).map((_, i) => {
          const t = i / (ticks - 1);
          const angle = -90 + t * 180;
          const active = Math.abs(t - pct) < 0.02;
          return (
            <span
              key={i}
              className={cn(
                "absolute left-1/2 top-1/2 origin-bottom",
                active ? "h-9 w-[3px] bg-foreground" : "h-7 w-px bg-muted-foreground/40",
              )}
              style={{ transform: `translate(-50%,-100%) rotate(${angle}deg) translateY(-30px)` }}
              aria-hidden
            />
          );
        })}
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="font-num text-2xl leading-none text-foreground">
            {Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1)}
          </p>
          {unit ? <p className="text-xs text-muted-foreground">{unit}</p> : null}
        </div>
      </div>
      <div className="mt-1 flex w-40 justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {label ? <p className="mt-1 text-xs text-muted-foreground">{label}</p> : null}
    </div>
  );
}

/** Compass rose with a needle, mirroring the wind direction card. */
export function Compass({
  direction,
  speed,
  unit = "km/h",
}: {
  direction: number;
  speed: number;
  unit?: string;
}) {
  return (
    <div className="relative mx-auto size-32 rounded-full border border-border">
      {["N", "E", "S", "W"].map((d, i) => (
        <span
          key={d}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 text-[10px] text-muted-foreground"
          style={{
            transform: `translate(-50%,-50%) rotate(${i * 90}deg) translateY(-56px) rotate(${-i * 90}deg)`,
          }}
        >
          {d}
        </span>
      ))}
      <span
        className="absolute left-1/2 top-1/2 h-12 w-[2px] origin-bottom bg-foreground"
        style={{ transform: `translate(-50%,-100%) rotate(${direction + 180}deg)` }}
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-num text-xl leading-none text-foreground">
          {speed.toFixed(0)}
        </span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
