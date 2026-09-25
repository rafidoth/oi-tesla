import { cn } from "cn"

interface SkeletonProps extends React.ComponentProps<"div"> {
  animate?: boolean
}

function Skeleton({ className, animate = false, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-[var(--radius-sm)] bg-surface-subtle",
        animate && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
