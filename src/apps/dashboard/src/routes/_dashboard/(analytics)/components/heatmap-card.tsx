import { Fragment, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetAnalytics } from "@/database/analytics";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";

export function HeatmapCard() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity: "day" });

  const heatMax = Math.max(
    1,
    ...analytics.hourlyHeatmap.map((cell) => cell.count),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              Carte de Chaleur des Ventes
            </CardTitle>
          </div>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: "100px repeat(24, minmax(26px, 1fr))",
            }}
          >
            <div className="p-2 text-xs text-muted-foreground">
              Jour / Heure
            </div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={`h-${hour}`}
                className="p-1 text-center text-[10px] text-muted-foreground"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
            {[
              { display: "Dimanche", key: "Dim" },
              { display: "Lundi", key: "Lun" },
              { display: "Mardi", key: "Mar" },
              { display: "Mercredi", key: "Mer" },
              { display: "Jeudi", key: "Jeu" },
              { display: "Vendredi", key: "Ven" },
              { display: "Samedi", key: "Sam" },
            ].map(({ display, key }) => (
              <Fragment key={key}>
                <div key={`${key}-label`} className="p-2 text-sm font-medium">
                  {display}
                </div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = analytics.hourlyHeatmap.find(
                    (item) => item.day === key && item.hour === hour,
                  );
                  const count = cell?.count ?? 0;
                  const intensity = count / heatMax;
                  return (
                    <div
                      key={`${key}-${hour}`}
                      className="h-6 border"
                      title={`${display} ${hour}:00 - ${count} ventes`}
                      style={{
                        backgroundColor: `hsl(25 95% 50% / ${Math.max(0.06, intensity)})`,
                      }}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
