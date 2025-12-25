'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Target,
  Info,
} from 'lucide-react';

interface PricingSuggestion {
  recommendedLow: number;
  recommendedHigh: number;
  adjustmentPercent: number;
  confidence: number;
  reason: string;
  localWinRate?: number;
  marketPosition: 'below' | 'average' | 'above';
  explanation: string;
  breakdown?: {
    baseLow: number;
    baseHigh: number;
    userAdjustment: number | null;
    localAdjustment: number | null;
    geoMultiplier: number | null;
    dataPoints: {
      userHistory: number;
      localMarket: number;
    };
  };
}

interface LearningContext {
  tradeId?: string;
  jobTypeId?: string;
  zipcode?: string;
  city?: string;
}

interface SmartPricingSuggestionProps {
  basePriceLow: number;
  basePriceHigh: number;
  currentPriceLow: number;
  currentPriceHigh: number;
  jobSize: number; // 1=small, 2=medium, 3=large
  onApplySuggestion: (low: number, high: number) => void;
  learningContext: LearningContext;
  className?: string;
}

/**
 * Smart pricing suggestion component
 * Shows learned pricing recommendations based on user patterns and geographic data
 */
export function SmartPricingSuggestion({
  basePriceLow,
  basePriceHigh,
  currentPriceLow,
  currentPriceHigh,
  jobSize,
  onApplySuggestion,
  learningContext,
  className,
}: SmartPricingSuggestionProps) {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!learningContext.tradeId || !learningContext.jobTypeId) return;

    const fetchSuggestion = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/learning/pricing-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            basePriceLow,
            basePriceHigh,
            jobSize,
            ...learningContext,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestion(data);
        }
      } catch (error) {
        console.error('Failed to fetch pricing suggestion:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestion();
    setApplied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePriceLow, basePriceHigh, jobSize, learningContext.tradeId, learningContext.jobTypeId, learningContext.zipcode]);

  // Check if current price matches suggestion
  useEffect(() => {
    if (suggestion) {
      const matchesLow = Math.abs(currentPriceLow - suggestion.recommendedLow) < 100;
      const matchesHigh = Math.abs(currentPriceHigh - suggestion.recommendedHigh) < 100;
      setApplied(matchesLow && matchesHigh);
    }
  }, [currentPriceLow, currentPriceHigh, suggestion]);

  const handleApply = () => {
    if (suggestion) {
      onApplySuggestion(suggestion.recommendedLow, suggestion.recommendedHigh);
      setApplied(true);
    }
  };

  if (!suggestion && !isLoading) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const confidenceLevel = suggestion?.confidence 
    ? suggestion.confidence >= 80 ? 'high' 
    : suggestion.confidence >= 60 ? 'medium' 
    : 'low'
    : 'low';

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      applied 
        ? 'border-green-300 bg-green-50' 
        : 'border-blue-200 bg-blue-50',
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between transition-colors',
          applied ? 'hover:bg-green-100' : 'hover:bg-blue-100'
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            applied ? 'bg-green-200' : 'bg-blue-200'
          )}>
            {applied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Brain className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="text-left">
            <h4 className="font-medium text-sm text-slate-900">
              {applied ? 'Smart Pricing Applied' : 'Smart Pricing Suggestion'}
            </h4>
            <p className="text-xs text-slate-500">
              {isLoading ? 'Analyzing pricing patterns...' : 
               suggestion ? `${suggestion.confidence}% confidence based on ${
                 suggestion.breakdown?.dataPoints.userHistory || 0
               } similar jobs` : 'No suggestion available'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : suggestion ? (
            <>
              {/* Main Price Suggestion */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Recommended Price Range</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatPrice(suggestion.recommendedLow)} - {formatPrice(suggestion.recommendedHigh)}
                    </p>
                  </div>
                  {suggestion.adjustmentPercent !== 0 && (
                    <div className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
                      suggestion.adjustmentPercent > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    )}>
                      {suggestion.adjustmentPercent > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {suggestion.adjustmentPercent > 0 ? '+' : ''}{suggestion.adjustmentPercent}%
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <p className="text-sm text-slate-600 mb-3">{suggestion.explanation}</p>

                {/* Insights */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Market Position */}
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    suggestion.marketPosition === 'above' 
                      ? 'bg-amber-100 text-amber-700'
                      : suggestion.marketPosition === 'below'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                  )}>
                    <Target className="w-3 h-3" />
                    {suggestion.marketPosition === 'above' 
                      ? 'Above market'
                      : suggestion.marketPosition === 'below'
                        ? 'Below market'
                        : 'Market average'}
                  </span>

                  {/* Confidence */}
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    confidenceLevel === 'high' 
                      ? 'bg-green-100 text-green-700'
                      : confidenceLevel === 'medium'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                  )}>
                    <Brain className="w-3 h-3" />
                    {suggestion.confidence}% confidence
                  </span>

                  {/* Local Win Rate */}
                  {suggestion.localWinRate !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <MapPin className="w-3 h-3" />
                      {Math.round(suggestion.localWinRate)}% local win rate
                    </span>
                  )}
                </div>

                {/* Apply Button */}
                {!applied && (
                  <Button
                    onClick={handleApply}
                    className="w-full"
                    variant="default"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Apply Suggested Price
                  </Button>
                )}
                {applied && (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Suggestion applied to your proposal
                  </div>
                )}
              </div>

              {/* Breakdown Toggle */}
              {suggestion.breakdown && (
                <div>
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    {showBreakdown ? 'Hide' : 'Show'} pricing breakdown
                  </button>

                  {showBreakdown && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Price:</span>
                        <span className="font-medium">
                          {formatPrice(suggestion.breakdown.baseLow)} - {formatPrice(suggestion.breakdown.baseHigh)}
                        </span>
                      </div>
                      {suggestion.breakdown.userAdjustment !== null && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Your Pattern:</span>
                          <span className={cn(
                            'font-medium',
                            suggestion.breakdown.userAdjustment > 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {suggestion.breakdown.userAdjustment > 0 ? '+' : ''}{suggestion.breakdown.userAdjustment}%
                          </span>
                        </div>
                      )}
                      {suggestion.breakdown.localAdjustment !== null && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Local Market:</span>
                          <span className={cn(
                            'font-medium',
                            suggestion.breakdown.localAdjustment > 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {suggestion.breakdown.localAdjustment > 0 ? '+' : ''}{suggestion.breakdown.localAdjustment}%
                          </span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <div className="flex justify-between text-slate-500">
                          <span>Data Points:</span>
                          <span>
                            {suggestion.breakdown.dataPoints.userHistory} from your history, 
                            {' '}{suggestion.breakdown.dataPoints.localMarket} from local market
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2">
              Complete more proposals to get pricing suggestions
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SmartPricingSuggestion;
