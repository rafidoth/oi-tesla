import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-surface-subtle text-ink-secondary",
        outline:
          "border-border bg-surface text-ink",
        destructive:
          "border-transparent bg-accent-red-surface text-accent-red",
        // Ride state variants (UI_DESIGN.md §1 & §6)
        requested:
          "border-transparent bg-surface-subtle text-ink-secondary",
        matched:
          "border-transparent bg-teal-surface text-teal-strong",
        driver_arrived:
          "border-transparent bg-accent-amber-surface text-ink",
        started:
          "border-transparent bg-accent-green-surface text-accent-green",
        completed:
          "border-transparent bg-accent-slate-surface text-accent-slate",
        cancelled:
          "border-transparent bg-accent-red-surface text-accent-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
