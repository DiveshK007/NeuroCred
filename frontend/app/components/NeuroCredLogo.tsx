'use client';

import Image from "next/image";
import { motion } from "framer-motion";

interface NeuroCredLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function NeuroCredLogo({ size = 'md', showText = true, className = '' }: NeuroCredLogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-sm' },
    md: { icon: 'w-10 h-10', text: 'text-base' },
    lg: { icon: 'w-16 h-16', text: 'text-xl' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular Logo with Gradient */}
      <motion.div
        className={`${currentSize.icon} rounded-xl relative flex items-center justify-center flex-shrink-0`}
        style={{
          background: 'linear-gradient(135deg, hsl(190, 100%, 50%) 0%, hsl(262, 83%, 58%) 100%)',
          boxShadow: '0 0 20px hsl(190, 100%, 50% / 0.4), 0 0 40px hsl(262, 83%, 58% / 0.3)',
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {/* Glowing outline effect */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(190, 100%, 50%) 0%, hsl(262, 83%, 58%) 100%)',
            filter: 'blur(4px)',
            opacity: 0.6,
            zIndex: -1,
          }}
        />
        
        {/* N Letter with gradient */}
        <span 
          className="text-xl font-bold font-mono relative z-10"
          style={{
            background: 'linear-gradient(135deg, hsl(195, 100%, 60%) 0%, hsl(270, 80%, 50%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 8px hsl(190, 100%, 50% / 0.5))',
          }}
        >
          N
        </span>
      </motion.div>

      {/* Text */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col"
        >
          <h1 className={`${currentSize.text} font-bold text-white whitespace-nowrap`}>
            NeuroCred
          </h1>
          {size !== 'sm' && (
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Credit Passport
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

