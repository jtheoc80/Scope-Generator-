'use client';

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { AuthorCard } from "./AuthorCard";

interface BlogHeroProps {
  title: string;
  excerpt: string;
  category: string;
  tags?: string[];
  author: {
    name: string;
    credentials?: string;
    avatar?: string;
  };
  datePublished: string;
  dateModified?: string;
  readTime: string;
  heroImage?: string;
  heroImageAlt?: string;
  className?: string;
}

export function BlogHero({ 
  title,
  excerpt,
  category,
  tags,
  author,
  datePublished,
  dateModified,
  readTime,
  heroImage,
  heroImageAlt,
  className
}: BlogHeroProps) {
  return (
    <header className={cn("relative", className)}>
      {/* Hero Image Section */}
      {heroImage && (
        <div className="relative h-64 sm:h-80 lg:h-96 bg-slate-900">
          <Image
            src={heroImage}
            alt={heroImageAlt || title}
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        </div>
      )}
      
      {/* Content Section */}
      <div className={cn(
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white",
        heroImage ? "-mt-32 relative z-10 pt-8" : "pt-16",
        "pb-12"
      )}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back button */}
            <Link href="/blog">
              <Button variant="ghost" className="text-slate-300 hover:text-white mb-6 -ml-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-4">
              <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full font-medium">
                {category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {datePublished}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              {title}
            </h1>
            
            {/* Excerpt */}
            <p className="text-lg text-slate-300 mb-6 leading-relaxed">
              {excerpt}
            </p>
            
            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Tag className="h-4 w-4 text-slate-500" />
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Author card */}
            <div className="pt-6 border-t border-slate-700">
              <AuthorCard
                author={author}
                datePublished={datePublished}
                dateModified={dateModified}
                readTime={readTime}
                variant="header"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default BlogHero;
