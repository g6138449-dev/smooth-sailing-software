import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { POLLUTANTS } from "@/lib/aqi";
import type { AqObservation } from "@/lib/types";

export function PollutantGrid({ aq }: { aq: AqObservation }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {POLLUTANTS.map((p) => {
        const value = aq[p.key];
        const ratio = Math.min(200, Math.round((value / p.threshold) * 100));
        const over = value > p.threshold;
        return (
          <Card key={p.key} className="gap-2 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">{p.label}</span>
              <span className={`font-num text-lg ${over ? "text-status-poor" : "text-status-good"}`}>
                {value} <span className="text-xs text-muted-foreground">{p.unit}</span>
              </span>
            </div>
            <Progress value={Math.min(100, ratio / 2)} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {ratio}% of the {p.threshold} {p.unit} demo guideline — {p.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
