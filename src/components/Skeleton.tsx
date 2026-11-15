export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-line/70 ${className}`} aria-hidden />
)
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="card divide-y divide-line/60 overflow-hidden">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-3 p-3.5">
        <Skeleton className="h-10 w-10 !rounded-xl" />
        <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3 !rounded-md" /><Skeleton className="h-3 w-1/3 !rounded-md" /></div>
        <Skeleton className="h-6 w-14 !rounded-md" />
      </div>
    ))}
  </div>
)
