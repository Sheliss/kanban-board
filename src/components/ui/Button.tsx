import { ReactNode } from "react";

export type ButtonType = "button" | "submit" | "reset";

interface OwnProps {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  type?: ButtonType;
  fullWidth?: boolean;
}

const Button: React.FC<OwnProps> = ({
  onClick,
  children,
  disabled,
  type,
  fullWidth,
}) => {
  return (
    <button
      className={`${fullWidth ? "w-full" : ""} py-2.5 px-4 bg-main hover:opacity-90 transition-opacity rounded-lg font-medium text-white disabled:opacity-50 shadow-sm cursor-pointer`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
