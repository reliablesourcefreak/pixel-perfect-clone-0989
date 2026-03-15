import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border">
          <Construction className="h-5 w-5 text-muted-foreground" strokeWidth={1} />
        </div>
        <div>
          <span className="catalog-num">Module — Pending</span>
          <h2 className="text-2xl font-serif text-foreground mt-2">{title}</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed tracking-wide">
          {description}
        </p>
      </div>
    </div>
  );
}
