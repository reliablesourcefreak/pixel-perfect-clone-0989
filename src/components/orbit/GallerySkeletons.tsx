import { Skeleton } from "@/components/ui/skeleton";

export function GalleryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border border border-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-background">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3 border-t border-border flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-none" />
            <Skeleton className="h-3.5 w-3.5 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">
      <div className="mb-14">
        <Skeleton className="h-3 w-24 rounded-none" />
        <Skeleton className="h-16 w-64 mt-4 rounded-none" />
        <Skeleton className="h-3 w-80 mt-5 rounded-none" />
      </div>
      <div className="border-t-2 border-accent mb-12" />
      <div className="flex gap-3 mb-12">
        <Skeleton className="h-9 w-40 rounded-none" />
        <Skeleton className="h-9 w-20 rounded-none" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        <div className="lg:col-span-2 bg-background">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="p-5 border-t border-border">
            <Skeleton className="h-4 w-48 rounded-none" />
          </div>
        </div>
        <div className="bg-background p-6 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-20 rounded-none" />
              <Skeleton className="h-5 w-8 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CodexListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-2 w-2 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
            <Skeleton className="h-3 w-24 rounded-none" />
          </div>
          <div className="border border-border divide-y divide-border">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20 rounded-none" />
                  <Skeleton className="h-4 w-40 rounded-none" />
                </div>
                <Skeleton className="h-3 w-full max-w-xl rounded-none" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StoriesListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="border border-border divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-20 rounded-none" />
            <Skeleton className="h-4 w-24 rounded-none" />
          </div>
          <Skeleton className="h-5 w-56 rounded-none" />
          <Skeleton className="h-3 w-full max-w-lg rounded-none" />
        </div>
      ))}
    </div>
  );
}

export function FavoritesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-border border border-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-background">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3 border-t border-border">
            <Skeleton className="h-3 w-24 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
