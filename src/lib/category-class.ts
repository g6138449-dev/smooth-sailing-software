import type { AqiCategory, AlertSeverity, RiskLevel } from "./types";
import { riskTone } from "./aqi";

/** Maps AQI categories onto the design-system status utilities. */
export function categoryTextClass(category: AqiCategory): string {
  switch (category) {
    case "Good":
      return "text-status-good";
    case "Moderate":
      return "text-status-moderate";
    case "Poor":
      return "text-status-poor";
    case "Very Poor":
      return "text-status-very-poor";
    case "Severe":
      return "text-status-severe";
  }
}

export function categoryBgClass(category: AqiCategory): string {
  switch (category) {
    case "Good":
      return "bg-status-good";
    case "Moderate":
      return "bg-status-moderate";
    case "Poor":
      return "bg-status-poor";
    case "Very Poor":
      return "bg-status-very-poor";
    case "Severe":
      return "bg-status-severe";
  }
}

export function riskTextClass(risk: RiskLevel): string {
  return categoryTextClass(riskTone(risk));
}

export function riskBgClass(risk: RiskLevel): string {
  return categoryBgClass(riskTone(risk));
}

export function severityTextClass(severity: AlertSeverity): string {
  switch (severity) {
    case "info":
      return "text-sev-info";
    case "watch":
      return "text-sev-watch";
    case "warning":
      return "text-sev-warning";
    case "severe":
      return "text-sev-severe";
  }
}

export function severityBgClass(severity: AlertSeverity): string {
  switch (severity) {
    case "info":
      return "bg-sev-info";
    case "watch":
      return "bg-sev-watch";
    case "warning":
      return "bg-sev-warning";
    case "severe":
      return "bg-sev-severe";
  }
}
