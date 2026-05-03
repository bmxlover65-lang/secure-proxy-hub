import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

type SeriesPoint = Record<string, string | number | null>;

type UsageChartsProps = {
  byDay: SeriesPoint[];
  byEndpoint: SeriesPoint[];
  byCategory: SeriesPoint[];
  byStatus: SeriesPoint[];
  loading: boolean;
  showSkeleton: boolean;
  cacheKey: string;
  refreshOverlay: ReactNode;
  lineSkeleton: ReactNode;
  barsSkeleton: ReactNode;
  pieSkeleton: ReactNode;
  statusSkeleton: ReactNode;
};

const CHART_COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--destructive)", "var(--accent)", "var(--secondary)"];
const axisColor = "var(--muted-foreground)";
const gridColor = "var(--border)";
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)" };

export default function UsageCharts({
  byDay,
  byEndpoint,
  byCategory,
  byStatus,
  loading,
  showSkeleton,
  cacheKey,
  refreshOverlay,
  lineSkeleton,
  barsSkeleton,
  pieSkeleton,
  statusSkeleton,
}: UsageChartsProps) {
  return (
    <div className="space-y-4">
      <Card className="border-border/60 animate-fade-in" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">Requests by day</CardTitle></CardHeader>
        <CardContent className="relative" style={{ height: 300 }}>
          {loading && !showSkeleton && refreshOverlay}
          {showSkeleton ? lineSkeleton : (
            <ResponsiveContainer width="100%" height="100%" key={`day-${cacheKey}`} className="animate-fade-in">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="var(--success)" strokeWidth={2} dot={false} isAnimationActive animationDuration={400} />
                <Line type="monotone" dataKey="failed" stroke="var(--destructive)" strokeWidth={2} dot={false} isAnimationActive animationDuration={400} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 animate-fade-in" style={{ background: "var(--gradient-card)" }}>
          <CardHeader><CardTitle className="text-base">Top endpoints</CardTitle></CardHeader>
          <CardContent className="relative" style={{ height: 320 }}>
            {loading && !showSkeleton && refreshOverlay}
            {showSkeleton ? barsSkeleton : (
              <ResponsiveContainer width="100%" height="100%" key={`ep-${cacheKey}`} className="animate-fade-in">
                <BarChart data={byEndpoint} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" stroke={axisColor} fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke={axisColor} fontSize={11} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} animationDuration={400} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 animate-fade-in" style={{ background: "var(--gradient-card)" }}>
          <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
          <CardContent className="relative" style={{ height: 320 }}>
            {loading && !showSkeleton && refreshOverlay}
            {showSkeleton ? pieSkeleton : (
              <ResponsiveContainer width="100%" height="100%" key={`cat-${cacheKey}`} className="animate-fade-in">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label animationDuration={400}>
                    {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 animate-fade-in" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle className="text-base">By status code</CardTitle></CardHeader>
        <CardContent className="relative" style={{ height: 280 }}>
          {loading && !showSkeleton && refreshOverlay}
          {showSkeleton ? statusSkeleton : (
            <ResponsiveContainer width="100%" height="100%" key={`st-${cacheKey}`} className="animate-fade-in">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} animationDuration={400} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}