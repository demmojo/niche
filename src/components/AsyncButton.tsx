import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function AsyncButton({
  isPending,
  loadingText,
  icon,
  children,
  className,
  disabled,
  type = "button",
  ...props
}: AsyncButtonProps) {
  return (
    <button
      type={type}
      disabled={isPending || disabled}
      className={cn(
        "flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {isPending ? (
        <span
          className="flex items-center gap-2"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>{loadingText || "Processing..."}</span>
        </span>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
