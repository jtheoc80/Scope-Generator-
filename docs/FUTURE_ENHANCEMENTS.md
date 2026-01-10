# Future Enhancement TODOs

This document tracks incomplete features and enhancements that are noted in the codebase with TODO comments.

## Learning System

The learning system in `src/lib/learning/` has several placeholder implementations that could be enhanced:

### 1. Option Learning (P3 - Medium Priority)

**Location**: `src/lib/learning/learning-service.ts:640`

```typescript
preferredOptions: {}, // TODO: Implement option learning
```

**Description**: The `getAllInsights` function should learn from user option selections across proposals. This would enable:
- Auto-selecting commonly used options for specific job types
- Suggesting options based on regional patterns
- Learning option combinations that correlate with won proposals

**Implementation Approach**:
1. Track option selections in `userActionLog` via `option_enable`, `option_disable`, `option_select` actions
2. Aggregate patterns in `userLearnedPreferences` table with category='options'
3. Return learned preferences keyed by option ID

**Estimated Effort**: 2-3 hours

---

### 2. Competitor Analysis (P3 - Medium Priority)

**Location**: `src/lib/learning/recommendation-engine.ts:389`

```typescript
competitorRange: null, // TODO: Implement competitor analysis
```

**Description**: The pricing suggestion system could incorporate competitor pricing data to help contractors price competitively.

**Implementation Approach**:
1. Integrate with market pricing data sources (1Build already connected)
2. Calculate percentile positioning of user's price vs market
3. Surface in pricing suggestions with confidence based on data availability

**Estimated Effort**: 4-6 hours (requires external data integration)

---

### 3. Option Recommendations (P3 - Medium Priority)

**Location**: `src/lib/learning/recommendation-engine.ts:459`

```typescript
options: [], // TODO: Implement option recommendations
```

**Description**: The recommendation engine should suggest which options to enable/disable based on learned patterns.

**Implementation Approach**:
1. Depends on Option Learning (#1 above)
2. Use patterns from `userLearnedPreferences` where category='options'
3. Filter by trade/job type context
4. Rank by confidence score

**Estimated Effort**: 2 hours (after Option Learning is implemented)

---

## Priority Classification

| Feature | Priority | Dependencies | Estimated Effort |
|---------|----------|--------------|------------------|
| Option Learning | P3 | None | 2-3 hours |
| Competitor Analysis | P3 | 1Build integration | 4-6 hours |
| Option Recommendations | P3 | Option Learning | 2 hours |

## Related Tables

These features primarily use:
- `user_action_log` - Raw event stream
- `user_learned_preferences` - Aggregated preferences
- `pricing_patterns` - Pricing adjustments
- `geographic_patterns` - Regional market data

---

*Last updated: January 2026*
