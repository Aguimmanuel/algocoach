import { useMemo } from "react";
import { toISO } from "../lib/srs";
import { cn } from "@/lib/utils";

interface Props {
  /** ISO dates (YYYY-MM-DD) on which the learner did anything at all */
  activeDays: string[];
  weeks?: number;
}

/**
 * A GitHub-style activity grid — twelve weeks of "did I show up".
 *
 * Why this and not a number: a streak counter tells you today, this tells you
 * the *shape* of your habit. A row of solid black is far more motivating to
 * keep going than any figure, and a gap is information rather than a scolding —
 * which is the line we deliberately do not cross.
 */
export default function StreakHeatmap({ activeDays, weeks = 12 }: Props) {
  const { cells, monthLabels } = useMemo(() => {
    const active = new Set(activeDays);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Walk back to the start of the week `weeks` ago, so columns line up to
    // weeks and the last column always contains today.
    const start = new Date(todayDate);
    start.setDate(start.getDate() - (weeks - 1) * 7 - start.getDay());

    const out: { date: string; count: number; inFuture: boolean }[] = [];
    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + w * 7 + d);
        const iso = toISO(cur);
        out.push({
          date: iso,
          count: active.has(iso) ? 1 : 0,
          inFuture: cur.getTime() > todayDate.getTime(),
        });

        if (d === 0 && cur.getMonth() !== lastMonth) {
          lastMonth = cur.getMonth();
          labels.push({ index: w, label: cur.toLocaleString(undefined, { month: "short" }) });
        }
      }
    }
    return { cells: out, monthLabels: labels };
  }, [activeDays, weeks]);

  const totalDays = activeDays.length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last {weeks} weeks</p>
        <p className="text-xs text-muted-foreground">
          <strong className="text-muted-foreground">{totalDays}</strong> active {totalDays === 1 ? "day" : "days"}
        </p>
      </div>

      <div className="mt-2 overflow-x-auto pb-1">
        <div className="min-w-max">
          {/* month labels */}
          <div className="mb-1 flex gap-[3px] pl-0">
            {Array.from({ length: weeks }).map((_, w) => {
              const found = monthLabels.find((m) => m.index === w);
              return (
                <div key={w} className="w-[13px] text-[9px] leading-3 text-muted-foreground">
                  {found ? found.label : ""}
                </div>
              );
            })}
          </div>

          {/* grid */}
          <div className="flex gap-[3px]">
            {Array.from({ length: weeks }).map((_, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, d) => {
                  const cell = cells[w * 7 + d];
                  if (!cell) return null;
                  return (
                    <div
                      key={d}
                      title={cell.inFuture ? "" : `${cell.date}${cell.count ? " · active" : ""}`}
                      className={cn(
                        "h-[13px] w-[13px] rounded-[3px] transition-colors duration-300",
                        cell.inFuture
                          ? "bg-transparent"
                          : cell.count
                            ? "bg-primary"
                            : "bg-muted hover:bg-border",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>less</span>
        <span className="h-[10px] w-[10px] rounded-[2px] bg-muted" />
        <span className="h-[10px] w-[10px] rounded-[2px] bg-primary" />
        <span>more</span>
      </div>
    </div>
  );
}
