import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-black text-white",
        secondary:
          "border-transparent bg-surface-subtle text-ink-secondary",
        outline:
          "border-border bg-surface text-ink",
        destructive:
          "border-transparent bg-error-surface text-error",
        // Ride state variants (UI_DESIGN.md §1 & §6)
        requested:
          "border-transparent bg-surface-subtle text-ink-secondary",
        matched:
          "border-transparent bg-info-surface text-info",
        driver_arrived:
          "border-transparent bg-warning-surface text-warning",
        started:
          "border-transparent bg-success-surface text-success",
        completed:
          "border-transparent bg-surface-subtle text-ink-secondary",
        cancelled:
          "border-transparent bg-error-surface text-error",
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
