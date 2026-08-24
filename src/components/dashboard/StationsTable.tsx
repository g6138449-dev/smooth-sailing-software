import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categoryTextClass } from "@/lib/category-class";
import { timeAgo } from "@/lib/format";
import type { StationReading } from "@/lib/types";

export function StationsTable({ readings }: { readings: StationReading[] }) {
  const sorted = [...readings].sort((a, b) => b.aqi - a.aqi);
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground">Monitoring stations</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Ranked by AQI. Demo readings mirror the CAAQMS record shape.
      </p>
      <div className="mt-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station</TableHead>
              <TableHead className="text-right">AQI</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">PM2.5</TableHead>
              <TableHead className="text-right">PM10</TableHead>
              <TableHead className="text-right">NO₂</TableHead>
              <TableHead className="text-right">1 h trend</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.station.id}>
                <TableCell>
                  <span className="font-medium text-foreground">{r.station.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.station.agency}</span>
                </TableCell>
                <TableCell className={`font-num text-right ${categoryTextClass(r.category)}`}>
                  {r.aqi}
                </TableCell>
                <TableCell className={`text-xs ${categoryTextClass(r.category)}`}>
                  {r.category}
                </TableCell>
                <TableCell className="font-num text-right">{r.pm25}</TableCell>
                <TableCell className="font-num text-right">{r.pm10}</TableCell>
                <TableCell className="font-num text-right">{r.no2}</TableCell>
                <TableCell
                  className={`font-num text-right ${
                    r.trend > 0 ? "text-status-poor" : "text-status-good"
                  }`}
                >
                  {r.trend > 0 ? "+" : ""}
                  {r.trend}%
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {timeAgo(r.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
