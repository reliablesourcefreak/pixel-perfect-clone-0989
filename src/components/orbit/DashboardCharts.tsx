import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

interface ChartData {
  artworks: { created_at: string }[];
  moods: string[];
  styles: string[];
  collectionSizes: { name: string; count: number; color: string }[];
}

const CHART_COLORS = [
  "hsl(var(--accent))",
  "hsl(210, 80%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(35, 85%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(330, 70%, 55%)",
  "hsl(195, 85%, 50%)",
  "hsl(15, 75%, 55%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border px-3 py-2">
      <p className="font-mono text-[10px] text-muted-foreground">{label}</p>
      <p className="font-serif text-sm text-foreground">{payload[0].value}</p>
    </div>
  );
};

export function DashboardCharts({ artworks, moods, styles, collectionSizes }: ChartData) {
  // Upload frequency: last 12 months
  const uploadData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = startOfMonth(subMonths(now, 11 - i));
      return { month: format(d, "MMM yy"), key: format(d, "yyyy-MM"), count: 0 };
    });
    artworks.forEach(a => {
      const key = format(parseISO(a.created_at), "yyyy-MM");
      const m = months.find(m => m.key === key);
      if (m) m.count++;
    });
    return months;
  }, [artworks]);

  // Mood distribution (top 6)
  const moodData = useMemo(() => {
    const map = new Map<string, number>();
    moods.forEach(m => map.set(m, (map.get(m) || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [moods]);

  // Style distribution (top 6)
  const styleData = useMemo(() => {
    const map = new Map<string, number>();
    styles.forEach(s => map.set(s, (map.get(s) || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [styles]);

  const hasData = artworks.length > 0;

  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0">
      {/* Upload frequency */}
      <div className="bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">Upload Frequency</span>
          <span className="font-mono text-[10px] text-muted-foreground">Last 12 months</span>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={uploadData}>
              <defs>
                <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--accent))"
                fill="url(#uploadGrad)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mood distribution */}
      <div className="bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">Mood Distribution</span>
          <span className="font-mono text-[10px] text-muted-foreground">{moodData.length} moods</span>
        </div>
        {moodData.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground tracking-wide">Moods appear after analysis.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    strokeWidth={1}
                    stroke="hsl(var(--background))"
                  >
                    {moodData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              {moodData.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="font-mono text-[10px] text-foreground truncate flex-1">{m.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Style distribution */}
      <div className="bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">Style Distribution</span>
          <span className="font-mono text-[10px] text-muted-foreground">{styleData.length} styles</span>
        </div>
        {styleData.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground tracking-wide">Styles appear after analysis.</p>
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={styleData} layout="vertical" barCategoryGap="20%">
                <XAxis type="number" allowDecimals={false}
                  tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis type="category" dataKey="name" width={90}
                  tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Collection sizes */}
      <div className="bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">Collection Sizes</span>
          <span className="font-mono text-[10px] text-muted-foreground">{collectionSizes.length} collections</span>
        </div>
        {collectionSizes.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground tracking-wide">Create collections to see sizes.</p>
        ) : (
          <div className="space-y-2.5">
            {collectionSizes.slice(0, 8).map(col => {
              const max = collectionSizes[0]?.count || 1;
              return (
                <div key={col.name}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0" style={{ backgroundColor: col.color }} />
                      <span className="font-mono text-[10px] text-foreground tracking-wide truncate">{col.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{col.count}</span>
                  </div>
                  <div className="h-1 bg-secondary relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700"
                      style={{ width: `${(col.count / max) * 100}%`, backgroundColor: col.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
