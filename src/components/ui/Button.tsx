import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  isCancel?: boolean;
  noShadow?: boolean;
  isSmall?: boolean;
}

export default function Button({
  children,
  fullWidth,
  isCancel,
  noShadow,
  isSmall,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`
        ${fullWidth ? "w-full" : ""}
        ${isCancel ? "bg-red-50 text-error border border-red-200 hover:bg-red-100" : "bg-main text-white hover:opacity-90"}
        ${noShadow ? "" : "shadow-sm"}
        ${isSmall ? "py-1.5 px-3 text-sm" : "py-2.5 px-4"}
        transition-colors rounded-lg font-medium disabled:opacity-50 cursor-pointer
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
