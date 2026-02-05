// /**
//  * useLearning Hook
//  * 
//  * React hook for integrating the learning system into components.
//  * Provides easy access to recommendations and action tracking.
//  */

// import { useState, useEffect, useCallback, useMemo } from 'react';
// import { useAuth } from './useAuth';
// import type { ProposalPhotoCategory } from '@shared/schema';

// // ==========================================
// // Types
// // ==========================================

// export interface LearningContext {
//   tradeId?: string;
//   jobTypeId?: string;
//   zipcode?: string;
//   city?: string;
//   state?: string;
//   neighborhood?: string;
//   proposalId?: number;
// }

// export interface PhotoSuggestion {
//   category: ProposalPhotoCategory;
//   confidence: number;
//   reason: string;
//   suggestedCaption?: string;
//   captionOptions: string[];
// }

// export interface ScopeSuggestion {
//   item: string;
//   action: 'add' | 'consider_removing';
//   confidence: number;
//   reason: string;
// }

// export interface PricingSuggestion {
//   recommendedLow: number;
//   recommendedHigh: number;
//   adjustmentPercent: number;
//   confidence: number;
//   reason: string;
//   localWinRate?: number;
// }

// export interface LearningInsights {
//   hasUserPatterns: boolean;
//   hasLocalData: boolean;
//   confidenceLevel: 'low' | 'medium' | 'high';
//   dataPointCount: number;
//   tips: string[];
// }

// // ==========================================
// // Hook Implementation
// // ==========================================

// export function useLearning(context: LearningContext) {
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(false);
//   const [photoSuggestions, setPhotoSuggestions] = useState<Record<number, PhotoSuggestion>>({});
//   const [scopeSuggestions, setScopeSuggestions] = useState<{
//     additions: ScopeSuggestion[];
//     removals: ScopeSuggestion[];
//   }>({ additions: [], removals: [] });
//   const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestion | null>(null);
//   const [insights, setInsights] = useState<LearningInsights>({
//     hasUserPatterns: false,
//     hasLocalData: false,
//     confidenceLevel: 'low',
//     dataPointCount: 0,
//     tips: ['Complete more proposals to improve recommendations'],
//   });

//   // Build full context with user ID
//   const fullContext = useMemo(() => ({
//     userId: user?.id || '',
//     ...context,
//   }), [user?.id, context]);

//   // ==========================================
//   // Fetch Recommendations
//   // ==========================================

//   const fetchPhotoSuggestion = useCallback(async (photoOrder: number): Promise<PhotoSuggestion | null> => {
//     if (!user?.id) return null;

//     try {
//       const response = await fetch('/api/learning/photo-suggestion', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           photoOrder,
//         }),
//       });

//       if (!response.ok) return null;

//       const data = await response.json();
      
//       // Cache the suggestion
//       setPhotoSuggestions(prev => ({
//         ...prev,
//         [photoOrder]: data,
//       }));

//       return data;
//     } catch (error) {
//       console.error('Failed to fetch photo suggestion:', error);
//       return null;
//     }
//   }, [user?.id, fullContext]);

//   const fetchScopeSuggestions = useCallback(async (currentScope: string[]) => {
//     if (!user?.id || !context.tradeId || !context.jobTypeId) return;

//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/learning/scope-suggestions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           currentScope,
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setScopeSuggestions(data);
//       }
//     } catch (error) {
//       console.error('Failed to fetch scope suggestions:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [user?.id, fullContext, context.tradeId, context.jobTypeId]);

//   const fetchPricingSuggestion = useCallback(async (
//     basePriceLow: number,
//     basePriceHigh: number,
//     jobSize: number
//   ) => {
//     if (!user?.id || !context.tradeId || !context.jobTypeId) return;

//     try {
//       const response = await fetch('/api/learning/pricing-suggestion', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           basePriceLow,
//           basePriceHigh,
//           jobSize,
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setPricingSuggestion(data);
//       }
//     } catch (error) {
//       console.error('Failed to fetch pricing suggestion:', error);
//     }
//   }, [user?.id, fullContext, context.tradeId, context.jobTypeId]);

//   // ==========================================
//   // Track Actions
//   // ==========================================

//   const trackPhotoCategory = useCallback(async (
//     photoOrder: number,
//     category: ProposalPhotoCategory,
//     caption: string | null,
//     wasAutoAssigned: boolean,
//     wasModified: boolean
//   ) => {
//     if (!user?.id) return;

//     try {
//       await fetch('/api/learning/track/photo-category', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           photoOrder,
//           category,
//           caption,
//           wasAutoAssigned,
//           wasModified,
//         }),
//       });
//     } catch (error) {
//       console.error('Failed to track photo category:', error);
//     }
//   }, [user?.id, fullContext]);

//   const trackScopeAction = useCallback(async (
//     scopeItem: string,
//     action: 'add' | 'remove' | 'modify',
//     isFromTemplate: boolean
//   ) => {
//     if (!user?.id) return;

//     try {
//       await fetch('/api/learning/track/scope-action', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           scopeItem,
//           action,
//           isFromTemplate,
//         }),
//       });
//     } catch (error) {
//       console.error('Failed to track scope action:', error);
//     }
//   }, [user?.id, fullContext]);

//   const trackPricingAdjustment = useCallback(async (
//     suggestedLow: number,
//     suggestedHigh: number,
//     finalLow: number,
//     finalHigh: number,
//     jobSize: number
//   ) => {
//     if (!user?.id) return;

//     try {
//       await fetch('/api/learning/track/pricing', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           suggestedLow,
//           suggestedHigh,
//           finalLow,
//           finalHigh,
//           jobSize,
//         }),
//       });
//     } catch (error) {
//       console.error('Failed to track pricing adjustment:', error);
//     }
//   }, [user?.id, fullContext]);

//   const trackProposalOutcome = useCallback(async (
//     proposalId: number,
//     outcome: 'won' | 'lost',
//     finalValue?: number
//   ) => {
//     if (!user?.id) return;

//     try {
//       await fetch('/api/learning/track/outcome', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           proposalId,
//           outcome,
//           finalValue,
//         }),
//       });
//     } catch (error) {
//       console.error('Failed to track proposal outcome:', error);
//     }
//   }, [user?.id]);

//   // ==========================================
//   // Get Caption Suggestions
//   // ==========================================

//   const getCaptionSuggestions = useCallback(async (
//     category: ProposalPhotoCategory
//   ): Promise<string[]> => {
//     if (!user?.id) return [];

//     try {
//       const response = await fetch('/api/learning/caption-suggestions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify({
//           ...fullContext,
//           category,
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         return data.suggestions || [];
//       }
//     } catch (error) {
//       console.error('Failed to get caption suggestions:', error);
//     }
//     return [];
//   }, [user?.id, fullContext]);

//   // ==========================================
//   // Fetch Initial Insights
//   // ==========================================

//   useEffect(() => {
//     if (!user?.id) return;

//     const fetchInsights = async () => {
//       try {
//         const response = await fetch('/api/learning/insights', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           credentials: 'include',
//           body: JSON.stringify(fullContext),
//         });

//         if (response.ok) {
//           const data = await response.json();
//           setInsights(data);
//         }
//       } catch (error) {
//         console.error('Failed to fetch learning insights:', error);
//       }
//     };

//     fetchInsights();
//   }, [user?.id, fullContext]);

//   return {
//     // State
//     isLoading,
//     photoSuggestions,
//     scopeSuggestions,
//     pricingSuggestion,
//     insights,

//     // Fetch recommendations
//     fetchPhotoSuggestion,
//     fetchScopeSuggestions,
//     fetchPricingSuggestion,
//     getCaptionSuggestions,

//     // Track actions
//     trackPhotoCategory,
//     trackScopeAction,
//     trackPricingAdjustment,
//     trackProposalOutcome,

//     // Helper to get suggestion for a specific photo
//     getPhotoSuggestion: (order: number) => photoSuggestions[order] || null,
//   };
// }

// export default useLearning;
