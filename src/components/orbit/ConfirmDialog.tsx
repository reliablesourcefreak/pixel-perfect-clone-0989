import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Pending = ConfirmOptions & { resolve: (v: boolean) => void };

let publish: ((p: Pending) => void) | null = null;

export function archiveConfirm(opts: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!publish) {
      // Fallback so flow never blocks if provider not mounted
      resolve(window.confirm(opts.description || opts.title || "Confirm?"));
      return;
    }
    publish({ ...opts, resolve });
  });
}

export function ConfirmDialog() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    publish = (p) => setPending(p);
    return () => {
      publish = null;
    };
  }, []);

  const handle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <AlertDialog open={!!pending} onOpenChange={(o) => !o && handle(false)}>
      <AlertDialogContent className="rounded-none border border-border bg-background">
        <AlertDialogHeader>
          <span className="catalog-num">Confirmation</span>
          <AlertDialogTitle className="font-serif text-2xl tracking-tight">
            {pending?.title || "Are you sure?"}
          </AlertDialogTitle>
          {pending?.description && (
            <AlertDialogDescription className="font-mono text-xs tracking-wide text-muted-foreground">
              {pending.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <div className="border-t border-border" />
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none font-mono text-[11px] tracking-widest uppercase">
            {pending?.cancelLabel || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handle(true)}
            className={`rounded-none font-mono text-[11px] tracking-widest uppercase ${
              pending?.destructive ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""
            }`}
          >
            {pending?.confirmLabel || "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}