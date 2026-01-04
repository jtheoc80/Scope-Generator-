'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface ChecklistItem {
  text: string;
  checked?: boolean;
  subItems?: string[];
}

interface ChecklistProps {
  title?: string;
  items: (string | ChecklistItem)[];
  variant?: 'default' | 'compact' | 'numbered';
  className?: string;
}

export function Checklist({ title, items, variant = 'default', className }: ChecklistProps) {
  const normalizedItems: ChecklistItem[] = items.map(item => 
    typeof item === 'string' ? { text: item, checked: true } : item
  );

  return (
    <div 
      className={cn(
        "my-6 rounded-lg border bg-white p-5 shadow-sm",
        className
      )}
    >
      {title && (
        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          {title}
        </h4>
      )}
      <ul className={cn(
        "space-y-3",
        variant === 'compact' && "space-y-2"
      )}>
        {normalizedItems.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            {variant === 'numbered' ? (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold flex items-center justify-center">
                {index + 1}
              </span>
            ) : item.checked ? (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <Check className="h-3 w-3 text-green-600" />
              </span>
            ) : (
              <span className="flex-shrink-0 mt-0.5">
                <Circle className="h-5 w-5 text-slate-300" />
              </span>
            )}
            <div className="flex-1">
              <span className={cn(
                "text-slate-700",
                variant === 'compact' && "text-sm"
              )}>
                {item.text}
              </span>
              {item.subItems && item.subItems.length > 0 && (
                <ul className="mt-2 ml-1 space-y-1.5">
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 mt-1">–</span>
                      {subItem}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Checklist;
