'use client';

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Calculator, FileText, Camera } from "lucide-react";

type CTAVariant = 'default' | 'calculator' | 'generator' | 'scopescan';

interface InlineCTAProps {
  variant?: CTAVariant;
  title?: string;
  description?: string;
  buttonText?: string;
  href?: string;
  className?: string;
}

const ctaConfig: Record<CTAVariant, {
  icon: React.ElementType;
  defaultTitle: string;
  defaultDescription: string;
  defaultButtonText: string;
  defaultHref: string;
  gradient: string;
}> = {
  default: {
    icon: Zap,
    defaultTitle: "Skip the writing. Generate this proposal automatically.",
    defaultDescription: "ScopeGen creates professional contractor proposals in about 60 seconds.",
    defaultButtonText: "Try It Free",
    defaultHref: "/app",
    gradient: "from-orange-500/10 to-amber-500/10",
  },
  calculator: {
    icon: Calculator,
    defaultTitle: "Get a quick project estimate",
    defaultDescription: "Use our free calculator with regional pricing data to estimate costs.",
    defaultButtonText: "Open Calculator",
    defaultHref: "/calculator",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  generator: {
    icon: FileText,
    defaultTitle: "Need a scope of work template?",
    defaultDescription: "Generate a professional scope document for your specific trade in minutes.",
    defaultButtonText: "Create Scope",
    defaultHref: "/scope-of-work-generator",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
  scopescan: {
    icon: Camera,
    defaultTitle: "Snap photos, get a scope",
    defaultDescription: "Take jobsite photos and let AI generate your scope of work automatically.",
    defaultButtonText: "Try ScopeScan",
    defaultHref: "/scopescan",
    gradient: "from-purple-500/10 to-violet-500/10",
  },
};

export function InlineCTA({ 
  variant = 'default',
  title,
  description,
  buttonText,
  href,
  className 
}: InlineCTAProps) {
  const config = ctaConfig[variant];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "my-8 p-6 rounded-lg border-l-4 border-orange-500 bg-gradient-to-r",
        config.gradient,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="bg-orange-500 p-2 rounded-lg flex-shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 mb-1">
            {title || config.defaultTitle}
          </p>
          <p className="text-slate-600 text-sm mb-4">
            {description || config.defaultDescription}
          </p>
          <Link href={href || config.defaultHref}>
            <Button 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {buttonText || config.defaultButtonText} 
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InlineCTA;
