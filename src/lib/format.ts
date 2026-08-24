import { degToCompass } from "./coupling";

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fmtDayHour(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function trendLabel(pct: number): { text: string; dir: "up" | "down" | "flat" } {
  if (Math.abs(pct) < 1) return { text: "Stable", dir: "flat" };
  return {
    text: `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% from previous hour`,
    dir: pct > 0 ? "up" : "down",
  };
}

export function windLabel(speed: number, dir: number): string {
  return `${speed.toFixed(1)} km/h ${degToCompass(dir)}`;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => esc(row[h])).join(","));
  return lines.join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
