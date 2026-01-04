'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X, Minus } from "lucide-react";

interface ComparisonRow {
  feature: string;
  values: (boolean | string | number)[];
  highlight?: boolean;
}

interface ComparisonTableProps {
  title?: string;
  headers: string[];
  rows: ComparisonRow[];
  className?: string;
  highlightColumn?: number;
}

export function ComparisonTable({ 
  title, 
  headers, 
  rows, 
  className,
  highlightColumn 
}: ComparisonTableProps) {
  const renderValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
          <Check className="h-4 w-4 text-green-600" />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
          <X className="h-4 w-4 text-red-500" />
        </span>
      );
    }
    if (value === '-' || value === 'N/A') {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
          <Minus className="h-4 w-4 text-slate-400" />
        </span>
      );
    }
    return <span className="text-slate-700">{value}</span>;
  };

  return (
    <div className={cn("my-8 overflow-hidden rounded-lg border bg-white shadow-sm", className)}>
      {title && (
        <div className="bg-slate-50 px-4 py-3 border-b">
          <h4 className="font-bold text-slate-900">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Feature</th>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={cn(
                    "px-4 py-3 text-center font-semibold text-slate-700",
                    highlightColumn === index && "bg-orange-50 text-orange-700"
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={cn(
                  "border-b last:border-b-0",
                  row.highlight && "bg-amber-50"
                )}
              >
                <td className="px-4 py-3 text-slate-600">
                  {row.feature}
                </td>
                {row.values.map((value, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={cn(
                      "px-4 py-3 text-center",
                      highlightColumn === colIndex && "bg-orange-50/50"
                    )}
                  >
                    {renderValue(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ComparisonTable;
