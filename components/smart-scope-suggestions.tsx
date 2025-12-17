'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Plus,
  Minus,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface ScopeSuggestion {
  item: string;
  action: 'add' | 'consider_removing';
  confidence: number;
  reason: string;
  winRateImpact?: number;
}

interface LearningContext {
  tradeId?: string;
  jobTypeId?: string;
  zipcode?: string;
  city?: string;
}

interface SmartScopeSuggestionsProps {
  currentScope: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
  learningContext: LearningContext;
  className?: string;
}

/**
 * Smart scope suggestions component
 * Shows learned suggestions for scope items based on user patterns and geographic data
 */
export function SmartScopeSuggestions({
  currentScope,
  onAddItem,
  onRemoveItem,
  learningContext,
  className,
}: SmartScopeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<{
    additions: ScopeSuggestion[];
    removals: ScopeSuggestion[];
  }>({ additions: [], removals: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedItems, setDismissedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!learningContext.tradeId || !learningContext.jobTypeId) return;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/learning/scope-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            currentScope,
            ...learningContext,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Failed to fetch scope suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentScope.length, learningContext.tradeId, learningContext.jobTypeId, learningContext.zipcode]);

  const handleAddItem = (item: string) => {
    onAddItem(item);
    setDismissedItems(prev => new Set(prev).add(item));
  };

  const handleDismiss = (item: string) => {
    setDismissedItems(prev => new Set(prev).add(item));
  };

  // Filter out dismissed items
  const visibleAdditions = suggestions.additions.filter(s => !dismissedItems.has(s.item));
  const visibleRemovals = suggestions.removals.filter(s => !dismissedItems.has(s.item));

  const hasVisibleSuggestions = visibleAdditions.length > 0 || visibleRemovals.length > 0;

  if (!hasVisibleSuggestions && !isLoading) {
    return null;
  }

  return (
    <div className={cn(
      'border border-primary/20 rounded-lg bg-primary/5 overflow-hidden',
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-sm text-slate-900">
              Smart Scope Suggestions
            </h4>
            <p className="text-xs text-slate-500">
              {isLoading ? 'Analyzing patterns...' : 
               `${visibleAdditions.length + visibleRemovals.length} suggestions based on your patterns`}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Suggestions */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Addition Suggestions */}
              {visibleAdditions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Consider Adding
                  </p>
                  {visibleAdditions.map((suggestion, index) => (
                    <SuggestionCard
                      key={`add-${index}`}
                      suggestion={suggestion}
                      variant="add"
                      onAccept={() => handleAddItem(suggestion.item)}
                      onDismiss={() => handleDismiss(suggestion.item)}
                    />
                  ))}
                </div>
              )}

              {/* Removal Suggestions */}
              {visibleRemovals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Review These Items
                  </p>
                  {visibleRemovals.map((suggestion, index) => (
                    <SuggestionCard
                      key={`remove-${index}`}
                      suggestion={suggestion}
                      variant="remove"
                      onAccept={() => onRemoveItem(suggestion.item)}
                      onDismiss={() => handleDismiss(suggestion.item)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {visibleAdditions.length === 0 && visibleRemovals.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  No suggestions at this time
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: ScopeSuggestion;
  variant: 'add' | 'remove';
  onAccept: () => void;
  onDismiss: () => void;
}

function SuggestionCard({
  suggestion,
  variant,
  onAccept,
  onDismiss,
}: SuggestionCardProps) {
  const confidenceLevel = suggestion.confidence >= 80 ? 'high' : 
                          suggestion.confidence >= 60 ? 'medium' : 'low';

  return (
    <div className={cn(
      'p-3 rounded-lg border bg-white',
      variant === 'add' ? 'border-green-200' : 'border-amber-200'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 mb-1">
            {suggestion.item}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className={cn(
                'w-3 h-3',
                confidenceLevel === 'high' ? 'text-green-500' :
                confidenceLevel === 'medium' ? 'text-blue-500' : 'text-slate-400'
              )} />
              {suggestion.confidence}% confidence
            </span>
            {suggestion.winRateImpact !== undefined && (
              <span className={cn(
                'flex items-center gap-1',
                suggestion.winRateImpact > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                <TrendingUp className="w-3 h-3" />
                {suggestion.winRateImpact > 0 ? '+' : ''}{suggestion.winRateImpact}% win rate
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">{suggestion.reason}</p>
        </div>
        
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant={variant === 'add' ? 'default' : 'destructive'}
            size="sm"
            className="h-7 text-xs"
            onClick={onAccept}
          >
            {variant === 'add' ? (
              <>
                <Plus className="w-3 h-3 mr-1" /> Add
              </>
            ) : (
              <>
                <Minus className="w-3 h-3 mr-1" /> Remove
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-slate-400 hover:text-slate-600"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SmartScopeSuggestions;
