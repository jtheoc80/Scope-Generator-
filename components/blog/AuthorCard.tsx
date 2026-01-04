'use client';

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { User, Calendar, RefreshCw, Clock } from "lucide-react";

interface AuthorInfo {
  name: string;
  credentials?: string;
  avatar?: string;
}

interface AuthorCardProps {
  author: AuthorInfo;
  datePublished: string;
  dateModified?: string;
  readTime: string;
  className?: string;
  variant?: 'header' | 'footer';
}

export function AuthorCard({ 
  author, 
  datePublished, 
  dateModified,
  readTime,
  className,
  variant = 'header'
}: AuthorCardProps) {
  const showUpdated = dateModified && dateModified !== datePublished;

  if (variant === 'footer') {
    return (
      <div className={cn(
        "bg-slate-50 rounded-lg p-6 border",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {author.avatar ? (
              <Image 
                src={author.avatar} 
                alt={author.name}
                width={64}
                height={64}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Written by</p>
            <p className="font-bold text-slate-900 text-lg">{author.name}</p>
            {author.credentials && (
              <p className="text-slate-600 text-sm mt-1">{author.credentials}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Published {datePublished}
              </span>
              {showUpdated && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Updated {dateModified}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Header variant (compact)
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
        {author.avatar ? (
          <Image 
            src={author.avatar} 
            alt={author.name}
            width={48}
            height={48}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div>
        <p className="font-medium text-white">{author.name}</p>
        <p className="text-sm text-slate-400">
          {author.credentials || 'Construction Industry Expert'}
        </p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-sm text-slate-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {readTime}
        </p>
      </div>
    </div>
  );
}

export default AuthorCard;
