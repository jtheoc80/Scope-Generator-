'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { List, ChevronDown, ChevronUp } from "lucide-react";
import { TOCItem, extractTOC } from "@/lib/blog-utils";

// Re-export for backward compatibility
export { extractTOC } from "@/lib/blog-utils";
export type { TOCItem } from "@/lib/blog-utils";

interface TableOfContentsProps {
  items: TOCItem[];
  className?: string;
  variant?: 'sidebar' | 'inline';
}

export function TableOfContents({ items, className, variant = 'inline' }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string>('');

  // Track scroll position for sidebar variant
  React.useEffect(() => {
    if (variant !== 'sidebar') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items, variant]);

  if (items.length < 3) return null;

  if (variant === 'sidebar') {
    return (
      <nav 
        className={cn(
          "hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto",
          className
        )}
      >
        <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <List className="h-4 w-4" />
          On this page
        </h4>
        <ul className="space-y-2 text-sm border-l-2 border-slate-100 pl-4">
          {items.map((item) => (
            <li 
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
            >
              <a
                href={`#${item.id}`}
                className={cn(
                  "block py-1 text-slate-500 hover:text-orange-600 transition-colors",
                  activeId === item.id && "text-orange-600 font-medium"
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  // Inline variant (collapsible on mobile)
  return (
    <div className={cn("bg-slate-50 border rounded-lg", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="font-bold text-slate-900 flex items-center gap-2">
          <List className="h-4 w-4" />
          Table of Contents
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <nav className="px-5 pb-4 border-t border-slate-200 pt-4">
          <ul className="space-y-2 text-sm">
            {items.map((item, index) => (
              <li 
                key={item.id}
                style={{ paddingLeft: `${(item.level - 2) * 16}px` }}
              >
                <a
                  href={`#${item.id}`}
                  className="flex items-start gap-2 text-slate-600 hover:text-orange-600 transition-colors py-1"
                >
                  <span className="text-slate-400 font-mono text-xs mt-0.5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

export default TableOfContents;
