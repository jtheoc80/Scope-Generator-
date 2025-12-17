# Adaptive Learning System

The ScopeGen app features a built-in learning system that silently observes user behavior and becomes instinctive after 7 days of usage.

## Philosophy

**Non-intrusive by design.** The learning system works entirely in the background with no pop-ups, suggestions cards, or prompts. Users simply use the app normally, and it adapts to them.

## How It Works

### Learning Period (Days 1-7)

During the first 7 days, the system:

- Silently observes all user actions
- Records pricing adjustments (e.g., user always adds 10%)
- Tracks scope modifications (items always added/removed)
- Notes photo categorization patterns
- Learns geographic patterns (pricing by zipcode)

**No user interaction required.** Everything happens automatically.

### Adaptation Period (Day 7+)

After 7 days of active usage, the system:

- **Auto-applies pricing adjustments**: If you always add 10% to bathroom estimates, it does it automatically
- **Pre-populates scope items**: Adds items you consistently include
- **Categorizes photos intelligently**: Based on your patterns
- **Suggests captions**: From your caption history

### Continuous Learning (Ongoing)

The system never stops learning. As you use the app, it:

- Refines its understanding of your preferences
- Adapts to new job types you take on
- Learns regional patterns from your service areas
- Improves confidence over time

## Built-in Construction Knowledge

The system has domain expertise built-in. It knows that:

### Toilet Installation needs:
- Wax ring seal
- Supply line/hose
- Closet bolts
- Caulk for base seal
- Leak testing

### Shower Installation needs:
- Waterproof membrane
- Cement board substrate
- Thinset and grout
- Silicone caulk

### Water Heater Installation needs:
- Expansion tank
- T&P discharge pipe
- Flexible water connectors
- Permit fees

...and many more trades/job types.

These items are **automatically added** to your scope. You don't need to remember them.

## Usage in Code

### Basic Usage

```tsx
import { useAdaptive } from '@/hooks/useAdaptive';

function ProposalForm({ userId, jobTypeId }) {
  const { applyLearning, track, status } = useAdaptive({
    userId,
    jobTypeId,
  });

  // Auto-enhance scope when creating proposal
  const handleCreateProposal = (baseScope) => {
    // This automatically adds:
    // 1. Construction requirements (wax ring, supply line, etc.)
    // 2. User's learned additions (items they always add)
    const enhancedScope = applyLearning.toScope(baseScope);
    
    // This automatically adjusts price based on user's patterns
    const { low, high } = applyLearning.toPrice(baseLow, baseHigh);
    
    // Track the creation (for learning)
    track.proposalCreate({ photoCount: 5, scopeCount: enhancedScope.length });
    
    return { scope: enhancedScope, priceLow: low, priceHigh: high };
  };
  
  // Track when user modifies scope
  const handleAddScopeItem = (item) => {
    track.scopeAdd(item); // Silent - for learning
    setScope([...scope, item]);
  };
  
  // Track when user adjusts price
  const handlePriceChange = (newPrice) => {
    const adjustmentPercent = ((newPrice - basePrice) / basePrice) * 100;
    track.priceAdjust(adjustmentPercent); // Silent - for learning
    setPrice(newPrice);
  };
}
```

### Simple Auto-Scope Hook

```tsx
import { useAutoScope } from '@/hooks/useAdaptive';

function ScopeEditor({ userId, jobTypeId, scope, setScope }) {
  // Automatically adds required items when jobTypeId changes
  useAutoScope(userId, jobTypeId, (additions) => {
    setScope(prev => [...prev, ...additions]);
  });
  
  return <ScopeList items={scope} />;
}
```

### Auto-Price Hook

```tsx
import { useAutoPrice } from '@/hooks/useAdaptive';

function PriceDisplay({ userId, baseLow, baseHigh, jobTypeId, zipcode }) {
  // Automatically adjusts price based on learned patterns
  const { low, high, wasAdjusted } = useAutoPrice(
    userId, baseLow, baseHigh, jobTypeId, zipcode
  );
  
  return (
    <div>
      ${low.toLocaleString()} - ${high.toLocaleString()}
      {wasAdjusted && <span>(adjusted based on your patterns)</span>}
    </div>
  );
}
```

## Data Storage

### Client-Side (localStorage)

The adaptive profile is stored in localStorage:

```
adaptive_profile_{userId} - User preferences and patterns
adaptive_actions_{userId} - Recent action history (last 500 actions)
```

### Server-Side (Database)

Long-term learning data is stored in PostgreSQL:

- `user_action_log` - Raw action events
- `user_learned_preferences` - Aggregated preferences
- `geographic_patterns` - Regional data
- `pricing_patterns` - Pricing history
- `scope_item_patterns` - Scope modification patterns
- `photo_categorization_learning` - Photo categorization history

## Learning Status

You can check the learning status:

```tsx
const { status } = useAdaptive({ userId, jobTypeId });

console.log(status);
// {
//   isAdapted: false,     // true after 7 days
//   daysActive: 3,        // days of usage
//   daysRemaining: 4,     // days until adapted
//   confidence: 45,       // 0-100 confidence score
// }
```

## What Gets Learned

| Area | What's Tracked | How It's Applied |
|------|---------------|------------------|
| Pricing | % adjustments from suggested | Auto-adjusts new proposals |
| Scope | Items added/removed | Pre-populates common items |
| Photos | Category by position | Auto-categorizes uploads |
| Captions | Text entered | Suggests from history |
| Job Types | Most common | Prioritizes in UI |
| Regions | Service areas | Regional adjustments |

## Privacy

- All learning data is tied to the user account
- Data can be cleared by the user
- No data is shared between users (except anonymous regional patterns)
- Local storage can be cleared by clearing browser data

## API Endpoints

The learning system uses these API endpoints:

- `POST /api/learning/track/photo-category` - Track photo categorization
- `POST /api/learning/track/scope-action` - Track scope changes
- `POST /api/learning/track/pricing` - Track pricing adjustments
- `POST /api/learning/track/outcome` - Track proposal outcomes
- `POST /api/learning/insights` - Get learning status
- `POST /api/learning/photo-suggestion` - Get photo suggestions
- `POST /api/learning/scope-suggestions` - Get scope suggestions
- `POST /api/learning/pricing-suggestion` - Get pricing suggestions
- `POST /api/learning/caption-suggestions` - Get caption suggestions

## Configuration

The learning system has these configurable constants:

```typescript
const LEARNING_PERIOD_DAYS = 7;      // Days before adapting
const MIN_ACTIONS_FOR_PATTERN = 3;   // Min actions to detect pattern
const HIGH_CONFIDENCE_THRESHOLD = 5; // Actions for high confidence
const PATTERN_THRESHOLD = 0.7;       // 70% consistency = pattern
```
