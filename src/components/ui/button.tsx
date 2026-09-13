import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-[var(--color-accent-hover)]",
        secondary: "border border-border bg-transparent text-fg hover:bg-elevated",
        ghost: "text-fg hover:bg-elevated",
        accent: "bg-accent text-accent-fg hover:bg-[var(--color-accent-hover)]",
      },
      size: {
        md: "h-11 px-5 text-sm rounded-lg",
        lg: "h-12 px-6 text-sm rounded-lg",
        xl: "min-h-12 px-6 py-3 text-sm rounded-lg",
        icon: "size-11 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
