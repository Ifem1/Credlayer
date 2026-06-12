import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-md text-black hover:scale-[1.02]",
        secondary:
          "rounded-md border text-white hover:scale-[1.02]",
        destructive:
          "rounded-md text-white",
        outline:
          "rounded-md border text-white hover:scale-[1.02]",
        ghost:
          "rounded-md text-white hover:bg-white/5",
        link:
          "underline-offset-4 hover:underline",
        success:
          "rounded-md text-black",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default:     { background: "#FCA311", color: "#000", fontFamily: "Space Grotesk", fontWeight: 700 },
  secondary:   { background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontFamily: "Manrope" },
  destructive: { background: "#FF4D4D", color: "#fff" },
  outline:     { background: "transparent", border: "1px solid rgba(252,163,17,0.5)", color: "#FCA311", fontFamily: "Manrope" },
  ghost:       { background: "transparent", color: "#fff" },
  link:        { background: "transparent", color: "#FCA311" },
  success:     { background: "#00F5A0", color: "#000", fontFamily: "Space Grotesk", fontWeight: 700 },
};

export function Button({ className, variant = "default", size, loading, children, style, ...props }: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant ?? "default"] ?? VARIANT_STYLES.default;
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ ...variantStyle, ...style }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}
