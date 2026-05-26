'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glassmorphism?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverEffect = true, glassmorphism = false, interactive = false, children, ...props }, ref) => {
    
    // Core base styling
    const baseStyle = "rounded-2xl border border-[#1e5faf]/15/90 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden";
    
    // Glassmorphism classes matching GCTU brand colors and styles in index.css
    const glassStyle = glassmorphism 
      ? "bg-[#0a2240]/60 backdrop-blur-sm/80 dark:bg-zinc-950/70 backdrop-blur-md border-[#1e5faf]/15/60 dark:border-zinc-800/50" 
      : "";
      
    // Shadow structures
    const shadowStyle = "shadow-[0_4px_24px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

    const combinedClasses = `${baseStyle} ${glassStyle} ${shadowStyle} ${interactive ? 'cursor-pointer select-none' : ''} ${className}`;

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          className={combinedClasses}
          whileHover={hoverEffect ? { y: -3, scale: 1.005, boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.08)" } : {}}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    if (hoverEffect) {
      return (
        <motion.div
          ref={ref}
          className={combinedClasses}
          whileHover={{ y: -3, boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.08)" }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={combinedClasses} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-5 pb-3 flex flex-col gap-1.5 border-b border-[#1e5faf]/15 dark:border-zinc-900/60 ${className}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-base font-black text-slate-900 dark:text-zinc-550 leading-tight mb-0 ${className}`} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p ref={ref} className={`text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0 ${className}`} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-5 flex-1 ${className}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-5 pt-3 border-t border-[#1e5faf]/15 dark:border-zinc-900/60 bg-[#06182e]/40/40 dark:bg-zinc-950/20 flex items-center justify-between gap-3 ${className}`} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
