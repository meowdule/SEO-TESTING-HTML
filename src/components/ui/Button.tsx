import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

type ButtonProps = {
  variant?: Variant;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClass: Record<Variant, string> = {
  primary: "btn btn-primary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
};

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const sz = size === "sm" ? "btn-sm" : "";
  return (
    <button type={type} className={`${variantClass[variant]} ${sz} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
