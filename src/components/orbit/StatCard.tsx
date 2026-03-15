import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "indigo" | "coral" | "sage" | "muted";
  delay?: number;
}

const colorMap = {
  indigo: "bg-primary/10 text-primary",
  coral: "bg-accent/10 text-accent",
  sage: "bg-secondary/10 text-secondary",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-body text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-display font-bold text-card-foreground">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
