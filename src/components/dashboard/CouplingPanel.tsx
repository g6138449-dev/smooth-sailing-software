import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { riskTextClass } from "@/lib/category-class";
import type { CouplingAssessment } from "@/lib/types";

export function CouplingPanel({ coupling }: { coupling: CouplingAssessment }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground">Weather–pollution coupling</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          How strongly current meteorology controls pollutant build-up.
        </p>

        <div className="mt-4 space-y-4">
          <Gauge label="Dispersion potential" value={coupling.dispersionPotential} good />
          <Gauge label="Accumulation potential" value={coupling.accumulationPotential} />
          <Gauge label="Coupling strength" value={coupling.couplingScore} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Overall risk:{" "}
          <span className={`font-semibold ${riskTextClass(coupling.riskLevel)}`}>
            {coupling.riskLevel}
          </span>
        </p>

        <ol className="mt-4 space-y-1.5">
          {coupling.chain.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs">
              <span className="font-num text-muted-foreground">{i + 1}.</span>
              <span
                className={
                  step.tone === "bad"
                    ? "text-status-poor"
                    : step.tone === "good"
                      ? "text-status-good"
                      : "text-muted-foreground"
                }
              >
                {step.step}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground">Driver mechanisms</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each link explains one meteorological driver and its physical effect.
        </p>
        <ul className="mt-4 space-y-3">
          {coupling.links.map((link) => (
            <li key={link.id} className="rounded-lg border border-border p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{link.driver}</span>
                <span className="font-num text-xs text-muted-foreground">{link.driverValue}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{link.mechanism}</p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={link.strength} className="h-1" />
                <span
                  className={`font-num text-[11px] ${
                    link.direction === "worsens"
                      ? "text-status-poor"
                      : link.direction === "improves"
                        ? "text-status-good"
                        : "text-muted-foreground"
                  }`}
                >
                  {link.strength}%
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{link.effect}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Gauge({ label, value, good }: { label: string; value: number; good?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-num ${good ? "text-status-good" : "text-status-poor"}`}>
          {value}%
        </span>
      </div>
      <Progress value={value} className="mt-1.5 h-2" />
    </div>
  );
}
