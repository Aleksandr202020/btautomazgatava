import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:bg-fg/90",
        secondary: "border border-border bg-transparent text-fg hover:bg-elevated",
        ghost: "text-fg hover:bg-elevated",
        accent: "bg-accent text-accent-fg hover:bg-accent/90",
      },
      size: {
        md: "h-11 px-5 text-sm rounded-md",
        lg: "h-12 px-6 text-sm tracking-[0.08em] uppercase rounded-md",
        xl: "min-h-12 px-6 py-3 text-sm tracking-[0.12em] uppercase rounded-lg",
        icon: "size-11 rounded-md",
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
