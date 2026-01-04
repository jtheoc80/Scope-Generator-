'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Calculator, DollarSign } from "lucide-react";

interface LineItem {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

interface WorkedExampleProps {
  title: string;
  scenario?: string;
  items: LineItem[];
  total?: {
    label: string;
    value: string | number;
  };
  footer?: string;
  className?: string;
}

export function WorkedExample({ 
  title, 
  scenario,
  items, 
  total,
  footer,
  className 
}: WorkedExampleProps) {
  const formatValue = (value: string | number, unit?: string) => {
    if (typeof value === 'number') {
      return `$${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
    }
    return value;
  };

  return (
    <div 
      className={cn(
        "my-8 rounded-lg border-2 border-slate-200 bg-white overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="bg-slate-800 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-orange-400" />
          <h4 className="font-bold">{title}</h4>
        </div>
        {scenario && (
          <p className="text-slate-300 text-sm mt-2">{scenario}</p>
        )}
      </div>
      
      {/* Line items */}
      <div className="divide-y divide-slate-100">
        {items.map((item, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center justify-between px-5 py-3",
              item.highlight && "bg-amber-50"
            )}
          >
            <span className="text-slate-600 text-sm">{item.label}</span>
            <span className={cn(
              "font-mono font-medium",
              item.highlight ? "text-amber-700" : "text-slate-900"
            )}>
              {formatValue(item.value, item.unit)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Total */}
      {total && (
        <div className="bg-slate-50 border-t-2 border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {total.label}
            </span>
            <span className="font-mono font-bold text-lg text-slate-900">
              {formatValue(total.value)}
            </span>
          </div>
        </div>
      )}
      
      {/* Footer note */}
      {footer && (
        <div className="bg-slate-50 border-t px-5 py-3">
          <p className="text-xs text-slate-500 italic">{footer}</p>
        </div>
      )}
    </div>
  );
}

export default WorkedExample;
