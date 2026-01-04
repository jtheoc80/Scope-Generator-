'use client';

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  heroImage?: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  className?: string;
}

export function RelatedPosts({ posts, className }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className={cn("py-12 bg-white border-t", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">
            Keep Reading
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="group h-full bg-slate-50 rounded-lg border hover:border-orange-300 hover:shadow-md transition-all overflow-hidden">
                  {/* Image placeholder */}
                  <div className="relative h-32 bg-gradient-to-br from-slate-200 to-slate-300">
                    {post.heroImage ? (
                      <Image
                        src={post.heroImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl opacity-20">📝</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="text-xs bg-white/90 text-slate-700 px-2 py-1 rounded font-medium">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-xs text-slate-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/blog">
              <Button variant="outline" className="hover:bg-orange-50 hover:border-orange-300">
                View All Articles <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RelatedPosts;
