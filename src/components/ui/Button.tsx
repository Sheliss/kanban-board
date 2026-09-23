import { ReactNode } from "react";

export type ButtonType = "button" | "submit" | "reset";

interface OwnProps {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  type?: ButtonType;
  fullWidth?: boolean;
  isCancel?: boolean;
  noShadow?: boolean;
  isSmall?: boolean;
}

const Button: React.FC<OwnProps> = ({
  onClick,
  children,
  disabled,
  type,
  fullWidth,
  isCancel,
  noShadow,
  isSmall,
}) => {
  return (
    <button
      className={`${fullWidth ? "w-full" : ""} ${isCancel ? "bg-red-50 text-error border border-red-200" : "bg-main text-white"} ${noShadow ? "" : "shadow-sm"} ${isSmall ? "py-1.5 px-3 text-sm" : "py-2.5 px-4"}  hover:opacity-90 transition-opacity rounded-lg font-medium disabled:opacity-50 cursor-pointer`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
