import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

// --- Brutalist Typography ---
/**
 *
 */
export const B_H1 = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h1
    className={`text-4xl md:text-5xl lg:text-6xl font-display font-bold text-[var(--color-brutal-text)] tracking-tight ${className}`}
  >
    {children}
  </h1>
);

/**
 *
 */
export const B_H2 = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={`text-3xl md:text-4xl font-display font-semibold text-[var(--color-brutal-text)] tracking-tight ${className}`}
  >
    {children}
  </h2>
);

/**
 *
 */
export const B_H3 = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={`text-2xl md:text-3xl font-display font-semibold text-[var(--color-brutal-text)] tracking-tight ${className}`}
  >
    {children}
  </h3>
);

/**
 *
 */
export const B_TextBody = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-base md:text-lg font-sans text-slate-300 ${className}`}>
    {children}
  </p>
);

/**
 *
 */
export const B_TextData = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-sm font-mono text-slate-400 ${className}`}>{children}</p>
);

// --- Brutalist Buttons ---
interface B_ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

/**
 *
 */
export const B_Button = ({
  children,
  variant = "primary",
  size = "md",
  startIcon,
  endIcon,
  className = "",
  ...props
}: B_ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider transition-all duration-150 active:translate-y-0.5 active:shadow-none border-2";

  const variants = {
    primary:
      "bg-[var(--color-brutal-chartreuse)] text-slate-900 border-[var(--color-brutal-chartreuse)] shadow-[4px_4px_0px_0px_rgba(217,249,157,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(217,249,157,0.3)]",
    danger:
      "bg-[var(--color-brutal-red)] text-white border-[var(--color-brutal-red)] shadow-[4px_4px_0px_0px_rgba(254,44,85,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(254,44,85,0.3)]",
    outline:
      "bg-transparent text-[var(--color-brutal-cyan)] border-[var(--color-brutal-cyan)] shadow-[4px_4px_0px_0px_rgba(0,240,255,0.2)] hover:bg-[var(--color-brutal-cyan)] hover:text-slate-900",
    ghost:
      "bg-transparent text-slate-300 border-transparent hover:text-white hover:bg-slate-800 shadow-none",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
    icon: "p-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="flex items-center gap-2">
        {startIcon}
        {children}
        {endIcon}
      </span>
    </button>
  );
};

// --- Brutalist Cards ---
/**
 *
 */
export const B_Card = ({
  children,
  className = "",
  glow = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-[var(--color-brutal-surface)] border-2 border-slate-700 p-6 ${glow ? "shadow-[0_0_15px_rgba(0,240,255,0.15)] border-[var(--color-brutal-cyan)]" : ""} ${onClick ? "cursor-pointer hover:border-[var(--color-brutal-cyan)] transition-colors" : ""} ${className}`}
  >
    {children}
  </div>
);

// --- Brutalist Badges ---
/**
 *
 */
export const B_Badge = ({
  children,
  variant = "info",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
  className?: string;
}) => {
  const variants = {
    info: "bg-[var(--color-brutal-cyan)] text-slate-900",
    success: "bg-[var(--color-brutal-chartreuse)] text-slate-900",
    warning: "bg-yellow-400 text-slate-900",
    danger: "bg-[var(--color-brutal-red)] text-white",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold uppercase ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// --- Brutalist Inputs ---
/**
 *
 */
export const B_Input = ({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      className="bg-slate-900 border-2 border-slate-700 focus:border-[var(--color-brutal-cyan)] text-[var(--color-brutal-text)] font-sans px-4 py-3 outline-none transition-colors placeholder:text-slate-600"
      {...props}
    />
  </div>
);

/**
 *
 */
export const B_Textarea = ({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <textarea
      className="bg-slate-900 border-2 border-slate-700 focus:border-[var(--color-brutal-cyan)] text-[var(--color-brutal-text)] font-sans px-4 py-3 outline-none transition-colors placeholder:text-slate-600 resize-none"
      {...props}
    />
  </div>
);
