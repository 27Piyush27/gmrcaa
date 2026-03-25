import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart
} from "recharts";

export function RevenueCharts({ payments = [] }) {
  const data = useMemo(() => {
    const completed = payments.filter(p => p.status === "completed");

    // Monthly revenue
    const monthlyMap = {};
    completed.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.toLocaleDateString("en-IN", { month: "short" })} '${String(d.getFullYear()).slice(-2)}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (p.total_amount || p.amount || 0);
    });
    const monthly = Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue)
    }));

    // Total stats
    const totalRevenue = completed.reduce((a, p) => a + (p.total_amount || p.amount || 0), 0);
    const totalGST = completed.reduce((a, p) => a + (p.gst_amount || 0), 0);
    const thisMonth = completed.filter(p => {
      const d = new Date(p.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((a, p) => a + (p.total_amount || p.amount || 0), 0);

    return { monthly, totalRevenue: Math.round(totalRevenue), totalGST: Math.round(totalGST), thisMonth: Math.round(thisMonth), count: completed.length };
  }, [payments]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue from completed payments</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-bold">₹{data.thisMonth.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">All Time</p>
              <p className="text-lg font-bold">₹{data.totalRevenue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.monthly.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No revenue data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthly}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
