import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  catalogId: string;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, catalogId }: StatCardProps) {
  return (
    <div className="border border-border p-6 bg-background">
      <div className="flex items-start justify-between">
        <div>
          <span className="catalog-num">{catalogId}</span>
          <p className="mt-3 text-4xl font-serif text-foreground">{value}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground tracking-wide uppercase">{label}</p>
        </div>
        <Icon className="h-4 w-4 text-muted-foreground/40" strokeWidth={1} />
      </div>
    </div>
  );
}
