import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/useLanguage";
import { initGA } from "@/lib/analytics";
import { usePageTracking } from "@/hooks/use-analytics";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Generator from "@/pages/generator";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import PublicProposal from "@/pages/public-proposal";
import Crew from "@/pages/crew";
import Invite from "@/pages/invite";
import PricingInsights from "@/pages/pricing-insights";
import SearchConsole from "@/pages/search-console";
import TradeLandingPage, { tradeCityRoutes, cityKeys as tradeCityKeys } from "@/pages/trade-landing";
import LocationLandingPage, { cities, trades } from "@/pages/location-landing";
import ComparePage, { competitorSlugs } from "@/pages/compare";
import BlogIndex, { blogSlugs } from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import SpanishLocationLandingPage, { spanishCities } from "@/pages/spanish-location-landing";
import Calculator from "@/pages/calculator";
import CompareBuildertrend from "@/pages/compare-buildertrend";
import CompareJobber from "@/pages/compare-jobber";
import CompareHouzz from "@/pages/compare-houzz";
import SEOTemplatePage, { templateSlugs } from "@/pages/seo-template";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import MarketPricing from "@/pages/market-pricing";
// Cost lookup page hidden for now - can be re-enabled later
// import CostLookup from "@/pages/cost-lookup";

const cityKeys = Object.keys(cities);
const tradeKeys = Object.keys(trades);
const spanishCityKeys = Object.keys(spanishCities);

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  usePageTracking();
  
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/app" component={Generator} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/crew" component={Crew} />
        <Route path="/pricing-insights" component={PricingInsights} />
        <Route path="/search-console" component={SearchConsole} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/invite/:token" component={Invite} />
        <Route path="/p/:token" component={PublicProposal} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/market-pricing" component={MarketPricing} />
        {/* Cost lookup hidden for now - re-enable when ready */}
        
        {/* Trade-specific SEO landing pages */}
        <Route path="/bathroom-remodeling-proposal">{() => <TradeLandingPage tradeSlug="bathroom-remodeling-proposal" />}</Route>
        <Route path="/kitchen-remodeling-proposal">{() => <TradeLandingPage tradeSlug="kitchen-remodeling-proposal" />}</Route>
        <Route path="/roofing-proposal">{() => <TradeLandingPage tradeSlug="roofing-proposal" />}</Route>
        <Route path="/painting-proposal">{() => <TradeLandingPage tradeSlug="painting-proposal" />}</Route>
        <Route path="/landscaping-proposal">{() => <TradeLandingPage tradeSlug="landscaping-proposal" />}</Route>
        <Route path="/hvac-proposal">{() => <TradeLandingPage tradeSlug="hvac-proposal" />}</Route>
        <Route path="/plumbing-proposal">{() => <TradeLandingPage tradeSlug="plumbing-proposal" />}</Route>
        <Route path="/electrical-proposal">{() => <TradeLandingPage tradeSlug="electrical-proposal" />}</Route>
        <Route path="/flooring-proposal">{() => <TradeLandingPage tradeSlug="flooring-proposal" />}</Route>
        <Route path="/siding-proposal">{() => <TradeLandingPage tradeSlug="siding-proposal" />}</Route>
        <Route path="/drywall-proposal">{() => <TradeLandingPage tradeSlug="drywall-proposal" />}</Route>
        <Route path="/window-installation-proposal">{() => <TradeLandingPage tradeSlug="window-installation-proposal" />}</Route>
        <Route path="/deck-building-proposal">{() => <TradeLandingPage tradeSlug="deck-building-proposal" />}</Route>
        <Route path="/fence-installation-proposal">{() => <TradeLandingPage tradeSlug="fence-installation-proposal" />}</Route>
        <Route path="/concrete-proposal">{() => <TradeLandingPage tradeSlug="concrete-proposal" />}</Route>
        <Route path="/tile-installation-proposal">{() => <TradeLandingPage tradeSlug="tile-installation-proposal" />}</Route>
        <Route path="/cabinet-installation-proposal">{() => <TradeLandingPage tradeSlug="cabinet-installation-proposal" />}</Route>
        
        {/* Trade + City SEO landing pages (top 3 trades × 5 Texas cities = 15 routes) */}
        {tradeCityRoutes.flatMap(tradeBase => 
          tradeCityKeys.map(citySlug => (
            <Route 
              key={`${tradeBase}-${citySlug}`}
              path={`/${tradeBase}-${citySlug}`}
            >
              {() => <TradeLandingPage tradeSlug={`${tradeBase}-proposal`} citySlug={citySlug} />}
            </Route>
          ))
        )}
        
        {/* Location + Trade SEO landing pages (90 combinations) */}
        {cityKeys.flatMap(citySlug => 
          tradeKeys.map(tradeSlug => (
            <Route 
              key={`${citySlug}-${tradeSlug}`}
              path={`/${citySlug}-${tradeSlug}-proposal`}
            >
              {() => <LocationLandingPage citySlug={citySlug} tradeSlug={tradeSlug} />}
            </Route>
          ))
        )}
        
        {/* Competitor comparison pages */}
        {competitorSlugs.map(slug => (
          <Route key={`compare-${slug}`} path={`/compare/${slug}`}>
            {() => <ComparePage competitorSlug={slug} />}
          </Route>
        ))}
        
        {/* SEO comparison pages with /vs/ routes */}
        <Route path="/vs/buildertrend" component={CompareBuildertrend} />
        <Route path="/vs/jobber" component={CompareJobber} />
        <Route path="/vs/houzz-pro" component={CompareHouzz} />
        
        {/* Blog pages */}
        <Route path="/blog" component={BlogIndex} />
        {blogSlugs.map(slug => (
          <Route key={`blog-${slug}`} path={`/blog/${slug}`}>
            {() => <BlogPostPage slug={slug} />}
          </Route>
        ))}
        
        {/* Spanish city landing pages */}
        {spanishCityKeys.map(citySlug => (
          <Route key={`es-${citySlug}`} path={`/es/${citySlug}`}>
            {() => <SpanishLocationLandingPage citySlug={citySlug} />}
          </Route>
        ))}
        
        {/* Long-tail keyword SEO template pages */}
        {templateSlugs.map(slug => (
          <Route key={`template-${slug}`} path={`/${slug}`}>
            {() => <SEOTemplatePage templateSlug={slug} />}
          </Route>
        ))}
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

initGA();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
