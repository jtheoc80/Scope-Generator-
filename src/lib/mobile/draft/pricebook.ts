export function computePriceRange(params: {
  basePriceLow: number;
  basePriceHigh: number;
  jobSize: number;
  userPriceMultiplier?: number | null; // percent, e.g. 110
  tradeMultiplier?: number | null; // percent, e.g. 105
  marketMultiplier?: number | null; // 0.9 - 1.15 (heuristic)
}) {
  const sizeFactor = params.jobSize === 1 ? 0.85 : params.jobSize === 3 ? 1.35 : 1;
  const userMult = (params.userPriceMultiplier ?? 100) / 100;
  const tradeMult = (params.tradeMultiplier ?? 100) / 100;
  const marketMult = params.marketMultiplier ?? 1;
  const mult = userMult * tradeMult * marketMult;

  const priceLow = Math.round(params.basePriceLow * sizeFactor * mult);
  const priceHigh = Math.round(params.basePriceHigh * sizeFactor * mult);

  return {
    priceLow,
    priceHigh: Math.max(priceHigh, priceLow),
  };
}
