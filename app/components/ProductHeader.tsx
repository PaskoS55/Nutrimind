import type { ReactNode } from "react";
import Brand from "./Brand";

type ProductHeaderProps = {
  children?: ReactNode;
  className?: string;
};

export default function ProductHeader({
  children,
  className = "",
}: ProductHeaderProps) {
  return (
    <header className={`product-header ${className}`.trim()}>
      <Brand />
      {children}
    </header>
  );
}
