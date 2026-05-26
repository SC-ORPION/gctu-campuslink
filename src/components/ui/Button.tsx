'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  animateHover?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconRight,
      fullWidth = false,
      animateHover = true,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base interactive styles
    const baseStyle = "inline-flex items-center justify-center font-bold font-sans transition-all duration-200 rounded-xl focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2 select-none shrink-0";
    
    // Size scales
    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs rounded-lg gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-12 px-6 text-base rounded-2xl gap-2.5"
    };

    // Premium styling variants matching GCTU brand colors and styles in index.css
    const variantStyles = {
      primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-transparent shadow-[0_4px_12px_rgba(79,70,229,0.2)] dark:shadow-[0_4px_12px_rgba(99,102,241,0.2)] focus:ring-indigo-500/20 active:bg-indigo-850",
      secondary: "bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-transparent shadow-[0_4px_12px_rgba(13,148,136,0.2)] focus:ring-teal-500/20 active:bg-teal-850",
      danger: "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-transparent shadow-[0_4px_12px_rgba(239,68,68,0.2)] focus:ring-red-550/20 active:bg-red-700",
      outline: "bg-white dark:bg-zinc-950 border border-[#1e5faf]/15 hover:bg-[#06182e]/40 text-slate-200 dark:border-zinc-800 dark:hover:bg-zinc-900/60 dark:text-zinc-300 focus:ring-slate-500/10 active:bg-[#0f3058]/30",
      ghost: "bg-transparent hover:bg-[#0f3058]/30/60 dark:hover:bg-zinc-900/60 text-slate-650 dark:text-zinc-400 focus:ring-slate-500/10 active:bg-[#0f3058]/30 dark:active:bg-zinc-900",
      link: "bg-transparent hover:underline text-indigo-600 dark:text-indigo-400 p-0 h-auto focus:ring-transparent shadow-none"
    };

    const widthStyle = fullWidth ? "w-full" : "";
    const combinedClasses = `${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`;

    const content = (
      <>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
        {!isLoading && icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
        <span className="leading-none">{children}</span>
        {!isLoading && iconRight && <span className="shrink-0 flex items-center justify-center">{iconRight}</span>}
      </>
    );

    // Apply framer-motion micro-animations only if hover animation is active, button is enabled, and not in link variant
    if (animateHover && !disabled && !isLoading && variant !== 'link') {
      return (
        <motion.button
          ref={ref}
          type={type}
          className={combinedClasses}
          whileHover={{ y: -1.5, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 450, damping: 14 }}
          {...(props as any)}
        >
          {content}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
