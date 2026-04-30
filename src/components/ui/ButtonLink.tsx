import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "ghost" | "danger";

type Props = {
  variant?: Variant;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
} & LinkProps;

const variantClass: Record<Variant, string> = {
  primary: "btn btn-primary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
};

export function ButtonLink({ variant = "ghost", size = "md", className = "", children, ...rest }: Props) {
  const sz = size === "sm" ? "btn-sm" : "";
  return (
    <Link className={`${variantClass[variant]} ${sz} ${className}`.trim()} {...rest}>
      {children}
    </Link>
  );
}
