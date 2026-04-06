import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isPending: controlledIsPending,
  loadingText,
  icon,
  children,
  disabled,
  type = "button",
  onClick,
  ref,
  ...props
}: ButtonProps) {
  const [internalIsPending, setInternalIsPending] = useState(false);
  const { pending: formPending } = useFormStatus();

  // If used inside a form as type submit, react to form status
  const isPending =
    controlledIsPending ??
    internalIsPending ??
    (type === "submit" && formPending);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isPending) {
      e.preventDefault();
      return;
    }

    if (!onClick) return;

    try {
      const result = onClick(e);
      if ((result as any) instanceof Promise) {
        setInternalIsPending(true);
        await result;
      }
    } finally {
      setInternalIsPending(false);
    }
  };

  const variants = {
    primary: "bg-ink-dark text-white hover:bg-black border border-transparent",
    secondary:
      "bg-white text-ink-dark border border-ink-dark/20 hover:border-ink-dark",
    outline:
      "bg-transparent text-ink-dark border-2 border-ink-dark hover:bg-ink-dark/5",
    ghost:
      "bg-transparent text-ink-dark/60 hover:text-ink-dark hover:bg-paper-base",
    destructive:
      "bg-red-500 text-white hover:bg-red-600 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2 text-sm",
    lg: "px-6 py-3 text-base w-full",
    icon: "p-2",
  };

  return (
    // eslint-disable-next-line no-restricted-syntax
    <button
      ref={ref}
      type={type}
      disabled={disabled} // explicitly don't use disabled={isPending} to keep tab order, though standard might drop tab order on disabled. We use aria-disabled instead. Wait, standard is aria-disabled="true".
      aria-disabled={disabled || isPending ? "true" : undefined}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        (disabled || isPending) && "opacity-50 pointer-events-none",
        variants[variant],
        sizes[size],
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
          {loadingText && <span>{loadingText}</span>}
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
