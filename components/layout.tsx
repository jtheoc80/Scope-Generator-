'use client';
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, Menu, X, Camera } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { OnboardingModal } from "@/components/onboarding-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const showOnboarding = Boolean(user && !user.onboardingCompleted);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
              <Hammer className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-heading font-bold text-primary uppercase tracking-tight leading-none">
              ScopeGen
            </span>
          </Link>

          {/* Desktop Navigation - Alphabetical Order */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/calculator"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Calculator
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              {t.nav.dashboard}
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              {t.nav.howItWorks}
            </Link>
            <Link
              href="/market-pricing"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              data-testid="nav-market-pricing"
            >
              {t.nav.marketPricing}
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              {t.pricing.title}
            </Link>
            {(user?.subscriptionPlan === 'pro' || user?.subscriptionPlan === 'crew') && (
              <Link
                href="/pricing-insights"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {t.nav.pricingInsights}
              </Link>
            )}
            {user?.subscriptionPlan === 'crew' && (
              <Link
                href="/search-console"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {t.nav.searchConsole}
              </Link>
            )}
            <Link
              href="/settings"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              {t.nav.settings}
            </Link>
            {user?.subscriptionPlan === 'crew' && (
              <Link
                href="/crew"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {t.nav.team}
              </Link>
            )}
            <LanguageSwitcher />
            {user ? (
              <Link
                href="/sign-out"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {t.nav.signOut}
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {t.nav.signIn}
              </Link>
            )}
            {user && (
              <Link 
                href="/m/create" 
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Start ScopeScan™"
                data-testid="nav-photo-capture"
              >
                <Camera className="h-5 w-5" />
              </Link>
            )}
            {location === "/" && (
              <Link
                href="/app"
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                {t.hero.cta}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2 text-slate-600 hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation - Alphabetical Order */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-white animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {/* ScopeScan - Featured prominently */}
              <Link 
                href="/m/create" 
                className="flex items-center gap-3 text-base font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-3 hover:bg-orange-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="nav-photo-capture-mobile"
              >
                <Camera className="w-5 h-5" />
                <div>
                  <span className="block">📷 ScopeScan™</span>
                  <span className="text-xs text-orange-600 font-normal">Snap a few photos → we generate a scope + estimate</span>
                </div>
              </Link>
              <Link 
                href="/calculator" 
                className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Calculator
              </Link>
              <Link 
                href="/dashboard" 
                className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.dashboard}
              </Link>
              <Link 
                href="/#how-it-works" 
                className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.howItWorks}
              </Link>
              <Link 
                href="/market-pricing" 
                className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="nav-market-pricing-mobile"
              >
                {t.nav.marketPricing}
              </Link>
              <Link 
                href="/#pricing" 
                className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.pricing.title}
              </Link>
              {(user?.subscriptionPlan === 'pro' || user?.subscriptionPlan === 'crew') && (
                <Link 
                  href="/pricing-insights" 
                  className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.pricingInsights}
                </Link>
              )}
              {user?.subscriptionPlan === 'crew' && (
                <Link 
                  href="/search-console" 
                  className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.searchConsole}
                </Link>
              )}
              <Link 
                href="/settings" 
                className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.settings}
              </Link>
              {user?.subscriptionPlan === 'crew' && (
                <Link 
                  href="/crew" 
                  className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.team}
                </Link>
              )}
              {user ? (
                <Link
                  href="/sign-out"
                  className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.signOut}
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.signIn}
                </Link>
              )}
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <Link 
                href="/app" 
                className="bg-orange-500 text-white px-4 py-3 rounded-md text-base font-semibold hover:bg-orange-600 transition-colors text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.hero.cta}
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Hammer className="w-5 h-5 text-secondary" />
                <span className="text-lg font-heading font-bold text-white uppercase">ScopeGen</span>
              </div>
              <p className="text-sm leading-relaxed">
                {t.footer.builtFor}
              </p>
            </div>
            
            {/* Tools Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/app" className="hover:text-white transition-colors">{t.nav.generator}</Link></li>
                <li><Link href="/calculator" className="hover:text-white transition-colors">Price Calculator</Link></li>
                <li><Link href="/contractor-estimate-generator" className="hover:text-white transition-colors">Estimate Generator</Link></li>
                <li><Link href="/scope-of-work-generator" className="hover:text-white transition-colors">Scope Generator</Link></li>
              </ul>
            </div>

            {/* Templates Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Templates</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/bathroom-remodel-estimate-template" className="hover:text-white transition-colors">Bathroom Estimate</Link></li>
                <li><Link href="/kitchen-remodel-estimate-template" className="hover:text-white transition-colors">Kitchen Estimate</Link></li>
                <li><Link href="/roofing-estimate-template" className="hover:text-white transition-colors">Roofing Estimate</Link></li>
                <li><Link href="/hvac-estimate-template" className="hover:text-white transition-colors">HVAC Estimate</Link></li>
                <li><Link href="/plumbing-estimate-template" className="hover:text-white transition-colors">Plumbing Estimate</Link></li>
                <li><Link href="/electrical-estimate-template" className="hover:text-white transition-colors">Electrical Estimate</Link></li>
              </ul>
            </div>

            {/* By Trade Column */}
            <div>
              <h4 className="text-white font-bold mb-4">By Trade</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/for/bathroom-remodeling" className="hover:text-white transition-colors">Bathroom Remodeling</Link></li>
                <li><Link href="/for/kitchen-remodeling" className="hover:text-white transition-colors">Kitchen Remodeling</Link></li>
                <li><Link href="/for/roofing" className="hover:text-white transition-colors">Roofing</Link></li>
                <li><Link href="/for/hvac" className="hover:text-white transition-colors">HVAC</Link></li>
                <li><Link href="/for/plumbing" className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link href="/for/electrical" className="hover:text-white transition-colors">Electrical</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-white transition-colors">{t.nav.blog}</Link></li>
                <li><Link href="/blog/contractor-pricing-guide-2025" className="hover:text-white transition-colors">Pricing Guide 2025</Link></li>
                <li><Link href="/blog/scope-of-work-template-examples" className="hover:text-white transition-colors">Scope Templates</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">{t.nav.howItWorks}</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">{t.pricing.title}</Link></li>
              </ul>
            </div>

            {/* Compare & Legal Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Compare</h4>
              <ul className="space-y-2 text-sm mb-6">
                <li><Link href="/vs/buildertrend" className="hover:text-white transition-colors">vs Buildertrend</Link></li>
                <li><Link href="/vs/jobber" className="hover:text-white transition-colors">vs Jobber</Link></li>
                <li><Link href="/vs/houzz-pro" className="hover:text-white transition-colors">vs Houzz Pro</Link></li>
              </ul>
              <h4 className="text-white font-bold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t.footer.privacyPolicy}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{t.footer.termsOfService}</Link></li>
              </ul>
            </div>
          </div>

          {/* More Templates Row */}
          <div className="border-t border-slate-800 pt-8 mb-8">
            <h4 className="text-white font-bold mb-4">More Estimate Templates</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/flooring-estimate-template" className="hover:text-white transition-colors">Flooring</Link>
              <Link href="/painting-estimate-template" className="hover:text-white transition-colors">Painting</Link>
              <Link href="/drywall-estimate-template" className="hover:text-white transition-colors">Drywall</Link>
              <Link href="/for/landscaping" className="hover:text-white transition-colors">Landscaping</Link>
              <Link href="/for/flooring" className="hover:text-white transition-colors">Flooring</Link>
              <Link href="/for/siding" className="hover:text-white transition-colors">Siding</Link>
              <Link href="/for/drywall" className="hover:text-white transition-colors">Drywall</Link>
              <Link href="/for/window-installation" className="hover:text-white transition-colors">Windows</Link>
              <Link href="/for/deck-building" className="hover:text-white transition-colors">Decks</Link>
              <Link href="/for/fence-installation" className="hover:text-white transition-colors">Fencing</Link>
              <Link href="/for/concrete" className="hover:text-white transition-colors">Concrete</Link>
              <Link href="/for/tile-installation" className="hover:text-white transition-colors">Tile</Link>
            </div>
          </div>

          {/* CTA Row */}
          <div className="border-t border-slate-800 pt-8 mb-8 text-center">
            <h4 className="text-white font-bold mb-4">{t.hero.cta}</h4>
            <Link 
              href="/app" 
              className="inline-block bg-secondary text-slate-900 px-6 py-3 rounded font-bold text-sm hover:bg-secondary/90 transition-colors"
            >
              {t.hero.cta}
            </Link>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-800 pt-8 text-center text-xs">
            © {new Date().getFullYear()} Lead Ledger LLC. {t.footer.copyright}
          </div>
        </div>
      </footer>

      <OnboardingModal open={showOnboarding} userName={user?.firstName} />
    </div>
  );
}
