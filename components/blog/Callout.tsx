'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Info,
  Wrench
} from "lucide-react";

export type CalloutType = 'tip' | 'warning' | 'mistake' | 'example' | 'info' | 'pro-tip';

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutConfig: Record<CalloutType, {
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
  defaultTitle: string;
}> = {
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    defaultTitle: 'Pro Tip',
  },
  'pro-tip': {
    icon: Wrench,
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    defaultTitle: 'From the Field',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-orange-500',
    iconColor: 'text-orange-600',
    titleColor: 'text-orange-800',
    defaultTitle: 'Watch Out',
  },
  mistake: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    defaultTitle: 'Common Mistake',
  },
  example: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    defaultTitle: 'Real Example',
  },
  info: {
    icon: Info,
    bgColor: 'bg-slate-50',
    borderColor: 'border-l-slate-400',
    iconColor: 'text-slate-600',
    titleColor: 'text-slate-800',
    defaultTitle: 'Note',
  },
};

export function Callout({ type, title, children, className }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "my-6 rounded-r-lg border-l-4 p-4",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm mb-1", config.titleColor)}>
            {title || config.defaultTitle}
          </p>
          <div className="text-slate-700 text-sm prose-sm [&>p]:m-0 [&>ul]:mt-2 [&>ul]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Callout;
