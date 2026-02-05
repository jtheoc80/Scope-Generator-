// Force dynamic rendering to prevent static generation errors
// This page uses useQuery which requires QueryClientProvider
export const dynamic = 'force-dynamic';

import MarketPricingClient from './market-pricing-client';

export default function MarketPricing() {
  return <MarketPricingClient />;
}
