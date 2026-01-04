'use client';

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FigureProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
}

export function Figure({ 
  src, 
  alt, 
  caption, 
  credit,
  width = 800,
  height = 450,
  priority = false,
  className,
  size = 'large'
}: FigureProps) {
  const sizeClasses = {
    small: 'max-w-sm mx-auto',
    medium: 'max-w-md mx-auto',
    large: 'max-w-2xl mx-auto',
    full: 'w-full',
  };

  return (
    <figure 
      className={cn(
        "my-8",
        sizeClasses[size],
        className
      )}
    >
      <div className="relative overflow-hidden rounded-lg border bg-slate-100 shadow-sm">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="w-full h-auto object-cover"
        />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-3 text-center">
          {caption && (
            <p className="text-sm text-slate-600 italic">{caption}</p>
          )}
          {credit && (
            <p className="text-xs text-slate-400 mt-1">
              Photo: {credit}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export default Figure;
