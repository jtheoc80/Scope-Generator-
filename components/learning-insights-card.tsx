'use client';

import { cn } from '@/lib/utils';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  Lightbulb, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LearningInsightsCardProps {
  insights: {
    hasUserPatterns: boolean;
    hasLocalData: boolean;
    confidenceLevel: 'low' | 'medium' | 'high';
    dataPointCount: number;
    tips: string[];
  };
  context?: {
    tradeId?: string;
    jobTypeId?: string;
    zipcode?: string;
    city?: string;
  };
  className?: string;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

/**
 * Displays learning system insights to the user
 * Shows confidence level, personalization status, and improvement tips
 */
export function LearningInsightsCard({
  insights,
  context,
  className,
  compact = false,
}: LearningInsightsCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  const confidenceConfig = {
    low: {
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: AlertCircle,
      label: 'Learning',
      description: 'Building your profile...',
    },
    medium: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: TrendingUp,
      label: 'Improving',
      description: 'Getting smarter with each use',
    },
    high: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      label: 'Personalized',
      description: 'Recommendations tuned to you',
    },
  };

  const config = confidenceConfig[insights.confidenceLevel];
  const ConfidenceIcon = config.icon;

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
          config.bgColor,
          config.borderColor,
          'hover:opacity-90',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Brain className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-sm font-medium', config.color)}>
            {config.label}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            insights.confidenceLevel === 'high' ? 'bg-green-100' : 
            insights.confidenceLevel === 'medium' ? 'bg-blue-100' : 'bg-amber-100'
          )}>
            <Brain className={cn('w-4 h-4', config.color)} />
          </div>
          <div>
            <h4 className={cn('font-semibold text-sm', config.color)}>
              Smart Recommendations: {config.label}
            </h4>
            <p className="text-xs text-slate-600">{config.description}</p>
          </div>
        </div>
        {compact && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={cn(
          'flex items-center gap-2 p-2 rounded-md',
          insights.hasUserPatterns ? 'bg-green-100' : 'bg-slate-100'
        )}>
          <ConfidenceIcon className={cn(
            'w-4 h-4',
            insights.hasUserPatterns ? 'text-green-600' : 'text-slate-400'
          )} />
          <span className={cn(
            'text-xs',
            insights.hasUserPatterns ? 'text-green-700' : 'text-slate-500'
          )}>
            {insights.hasUserPatterns ? 'Your patterns learned' : 'Learning your style...'}
          </span>
        </div>
        <div className={cn(
          'flex items-center gap-2 p-2 rounded-md',
          insights.hasLocalData ? 'bg-green-100' : 'bg-slate-100'
        )}>
          <MapPin className={cn(
            'w-4 h-4',
            insights.hasLocalData ? 'text-green-600' : 'text-slate-400'
          )} />
          <span className={cn(
            'text-xs',
            insights.hasLocalData ? 'text-green-700' : 'text-slate-500'
          )}>
            {insights.hasLocalData 
              ? `${context?.city || context?.zipcode || 'Local'} data active` 
              : 'Building local insights...'}
          </span>
        </div>
      </div>

      {/* Data Points Indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-600">Learning Progress</span>
          <span className="text-xs font-medium text-slate-700">
            {insights.dataPointCount} data points
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              insights.confidenceLevel === 'high' ? 'bg-green-500' :
              insights.confidenceLevel === 'medium' ? 'bg-blue-500' : 'bg-amber-500'
            )}
            style={{ 
              width: `${Math.min(100, insights.dataPointCount * 2)}%` 
            }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          {insights.dataPointCount < 10 
            ? 'Just getting started' 
            : insights.dataPointCount < 30 
              ? 'Building reliable patterns' 
              : 'Strong personalization active'}
        </p>
      </div>

      {/* Tips */}
      {insights.tips.length > 0 && (
        <div className="bg-white/50 rounded-md p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-slate-700">
              Improve Your Recommendations
            </span>
          </div>
          <ul className="space-y-1">
            {insights.tips.slice(0, 3).map((tip, index) => (
              <li key={index} className="text-xs text-slate-600 flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What We're Learning */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          <p className="text-[10px] text-slate-500">
            <strong>What we learn:</strong> Your photo preferences, scope modifications, 
            pricing patterns, and what works in your area. All data stays private and 
            is used only to improve your experience.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline confidence indicator for individual suggestions
 */
export function ConfidenceBadge({ 
  confidence, 
  reason,
  size = 'sm',
}: { 
  confidence: number; 
  reason?: string;
  size?: 'xs' | 'sm';
}) {
  const level = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';
  
  const config = {
    high: { color: 'text-green-600', bg: 'bg-green-100', label: 'High confidence' },
    medium: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good match' },
    low: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Learning...' },
  };

  const c = config[level];

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        c.bg, c.color,
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
      title={reason || c.label}
    >
      <Brain className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {confidence}%
    </span>
  );
}

/**
 * Smart suggestion pill with learning indicator
 */
export function SmartSuggestionPill({
  label,
  confidence,
  onClick,
  selected = false,
}: {
  label: string;
  confidence: number;
  onClick?: () => void;
  selected?: boolean;
}) {
  const level = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
        'border hover:scale-105',
        selected 
          ? 'bg-primary text-white border-primary' 
          : level === 'high'
            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            : level === 'medium'
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      )}
    >
      {!selected && <Sparkles className="w-3 h-3" />}
      {label}
      {!selected && (
        <span className={cn(
          'text-[10px] opacity-70',
          level === 'high' ? 'text-green-600' :
          level === 'medium' ? 'text-blue-600' : 'text-slate-500'
        )}>
          {confidence}%
        </span>
      )}
    </button>
  );
}

export default LearningInsightsCard;
