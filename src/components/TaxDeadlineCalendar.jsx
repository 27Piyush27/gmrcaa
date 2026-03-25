import { useMemo } from "react";
import { Calendar, AlertTriangle, Clock, CheckCircle } from "lucide-react";

const TAX_DEADLINES = [
  { date: "2026-06-15", name: "Advance Tax - Q1", desc: "15% of estimated tax", type: "tax" },
  { date: "2026-07-07", name: "TDS Payment", desc: "TDS for June", type: "tds" },
  { date: "2026-07-31", name: "ITR Filing Deadline", desc: "For individuals & HUF", type: "itr" },
  { date: "2026-09-15", name: "Advance Tax - Q2", desc: "45% of estimated tax", type: "tax" },
  { date: "2026-10-07", name: "TDS Payment", desc: "TDS for September", type: "tds" },
  { date: "2026-10-31", name: "ITR (Audit Required)", desc: "Companies & audited firms", type: "itr" },
  { date: "2026-11-30", name: "Belated/Revised ITR", desc: "Last date for belated return", type: "itr" },
  { date: "2026-12-15", name: "Advance Tax - Q3", desc: "75% of estimated tax", type: "tax" },
  { date: "2027-01-07", name: "TDS Payment", desc: "TDS for December", type: "tds" },
  { date: "2027-03-15", name: "Advance Tax - Q4", desc: "100% of estimated tax", type: "tax" },
  { date: "2027-03-31", name: "Financial Year End", desc: "FY 2026-27 closes", type: "other" },
];

const TYPE_STYLES = {
  tax: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
  tds: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
  itr: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
  other: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400",
};

export function TaxDeadlineCalendar() {
  const upcoming = useMemo(() => {
    const now = new Date();
    return TAX_DEADLINES
      .filter(d => new Date(d.date) >= now)
      .slice(0, 5)
      .map(d => {
        const target = new Date(d.date);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return { ...d, daysLeft: diff, isUrgent: diff <= 7 };
      });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Upcoming Tax Deadlines</h3>
      </div>
      {upcoming.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          All deadlines are clear!
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((d, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${TYPE_STYLES[d.type]}`}>
              <div className="text-center min-w-[40px]">
                <div className="text-lg font-bold leading-none">{new Date(d.date).getDate()}</div>
                <div className="text-[10px] uppercase mt-0.5 opacity-80">
                  {new Date(d.date).toLocaleDateString("en-IN", { month: "short" })}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-snug">{d.name}</p>
                <p className="text-[10px] opacity-70 truncate">{d.desc}</p>
              </div>
              <div className={`text-[10px] font-medium whitespace-nowrap flex items-center gap-1 ${d.isUrgent ? "text-red-600 dark:text-red-400" : ""}`}>
                {d.isUrgent && <AlertTriangle className="w-3 h-3" />}
                {d.daysLeft === 0 ? "Today!" : `${d.daysLeft}d`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
