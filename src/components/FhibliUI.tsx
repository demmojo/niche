import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  Flame,
  Bug,
  Leaf,
  Search,
  Menu,
  User,
  Settings,
  Bell,
  Home,
  Star,
  Heart,
} from "lucide-react";

// --- Typography ---
/**
 *
 */
export const H1 = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h1
    className={`text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-ghibli-charcoal mb-4 ${className}`}
  >
    {children}
  </h1>
);
/**
 *
 */
export const H2 = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={`text-3xl md:text-4xl font-heading font-semibold text-ghibli-charcoal mb-3 ${className}`}
  >
    {children}
  </h2>
);
/**
 *
 */
export const H3 = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={`text-2xl md:text-3xl font-heading font-semibold text-ghibli-charcoal mb-3 ${className}`}
  >
    {children}
  </h3>
);
/**
 *
 */
export const TextLg = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p
    className={`text-lg md:text-xl text-ghibli-charcoal-light mb-2 ${className}`}
  >
    {children}
  </p>
);
/**
 *
 */
export const TextMd = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-base text-ghibli-charcoal-light mb-2 ${className}`}>
    {children}
  </p>
);
/**
 *
 */
export const TextSm = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-sm text-ghibli-charcoal-light mb-1 ${className}`}>
    {children}
  </p>
);

// --- Buttons ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  badge?: string;
}

/**
 *
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  startIcon,
  endIcon,
  badge,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 active:scale-95 shadow-soft hover:shadow-soft-hover";

  const variants = {
    primary: "bg-ghibli-green-500 hover:bg-ghibli-green-600 text-white",
    secondary:
      "bg-ghibli-wood-200 hover:bg-ghibli-wood-300 text-ghibli-charcoal",
    outline:
      "border-2 border-ghibli-green-400 text-ghibli-green-600 hover:bg-ghibli-green-50",
    ghost:
      "bg-transparent hover:bg-ghibli-green-50 text-ghibli-charcoal shadow-none hover:shadow-none",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
    icon: "p-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} relative overflow-hidden group`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {startIcon}
        {children}
        {endIcon}
      </span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-ghibli-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-20">
          {badge}
        </span>
      )}
    </button>
  );
};

// --- Cards ---
/**
 *
 */
export const Card = ({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) => (
  <div
    className={`bg-white rounded-3xl p-6 shadow-soft border border-ghibli-wood-100 ${hover ? "hover:shadow-soft-hover transition-shadow duration-300" : ""} ${className} relative overflow-hidden`}
  >
    {/* Subtle paper texture overlay */}
    <div
      className="absolute inset-0 opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      }}
    ></div>
    <div className="relative z-10">{children}</div>
  </div>
);

// --- Badges ---
/**
 *
 */
export const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}) => {
  const variants = {
    default: "bg-ghibli-blue-100 text-ghibli-charcoal",
    success: "bg-ghibli-green-100 text-ghibli-green-600",
    warning: "bg-ghibli-yellow text-ghibli-wood-500",
    error: "bg-red-100 text-ghibli-red",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// --- Inputs ---
/**
 *
 */
export const Input = ({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-sm font-semibold text-ghibli-charcoal-light ml-1">
        {label}
      </label>
    )}
    <input
      className="bg-ghibli-wood-100/50 border-2 border-transparent focus:border-ghibli-green-300 focus:bg-white rounded-2xl px-4 py-3 text-ghibli-charcoal outline-none transition-all duration-200 placeholder:text-ghibli-wood-400"
      {...props}
    />
  </div>
);

/**
 *
 */
export const Textarea = ({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-sm font-semibold text-ghibli-charcoal-light ml-1">
        {label}
      </label>
    )}
    <textarea
      className="bg-ghibli-wood-100/50 border-2 border-transparent focus:border-ghibli-green-300 focus:bg-white rounded-2xl px-4 py-3 text-ghibli-charcoal outline-none transition-all duration-200 placeholder:text-ghibli-wood-400 resize-none"
      {...props}
    />
  </div>
);

// --- Accordion ---
/**
 *
 */
export const Accordion = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-ghibli-wood-200 rounded-2xl overflow-hidden mb-3 bg-white">
      <button
        className="w-full flex items-center justify-between p-4 text-left font-semibold text-ghibli-charcoal hover:bg-ghibli-green-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-ghibli-green-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-ghibli-charcoal-light border-t border-ghibli-wood-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Avatar ---
/**
 *
 */
export const Avatar = ({
  src,
  alt,
  size = "md",
  fallback,
}: {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  fallback: string;
}) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full overflow-hidden bg-ghibli-green-200 flex items-center justify-center text-ghibli-green-600 font-bold border-2 border-white shadow-sm shrink-0`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
};

// --- Leaf Animation ---
/**
 *
 */
export const LeafAnimation = () => {
  return (
    <div className="leaf-container">
      <div className="leaf"></div>
    </div>
  );
};
