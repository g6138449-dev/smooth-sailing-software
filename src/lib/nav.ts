import {
  AlertTriangle,
  BarChart3,
  Beaker,
  CloudSun,
  FileText,
  Gauge,
  Layers,
  LineChart,
  Map,
  PieChart,
  Settings,
  ShieldCheck,
  Waves,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Sidebar navigation for the AeroSense NCR console. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/live-air-quality", label: "Live Air Quality", icon: Activity },
  { to: "/weather", label: "Weather Conditions", icon: CloudSun },
  { to: "/coupling", label: "Coupling Intelligence", icon: Layers },
  { to: "/forecast", label: "72-Hour Forecast", icon: LineChart },
  { to: "/pollution-movement", label: "Pollution Movement", icon: Waves },
  { to: "/risk-map", label: "Risk Map", icon: Map },
  { to: "/source-attribution", label: "Source Attribution", icon: PieChart },
  { to: "/simulator", label: "What-If Simulator", icon: Beaker },
  { to: "/alerts", label: "Alerts & Early Warning", icon: AlertTriangle },
  { to: "/analytics", label: "Historical Analytics", icon: BarChart3 },
  { to: "/model-health", label: "Model / Data Health", icon: ShieldCheck },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];
