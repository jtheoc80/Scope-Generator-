// Server component — metadata is handled by layout.tsx.
// Removed 'use client' and useEffect document.title overrides that were
// interfering with server-side metadata (invisible to Googlebot).
import LayoutWrapper from "@/components/layout-wrapper";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompareBuildertrend() {
  return (
    <LayoutWrapper>
      <article className="bg-white">
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6" data-testid="h1-compare-buildertrend">
                ScopeGen vs Buildertrend: Which Proposal Software is Right for You?
              </h1>
              <p className="text-xl text-slate-300 mb-8" data-testid="text-intro-buildertrend">
                Both ScopeGen and Buildertrend help contractors create proposals, but they serve very different needs. ScopeGen is a fast, focused proposal generator for small contractors, while Buildertrend is a comprehensive construction management platform designed for larger companies. Let&apos;s break down the key differences.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 text-center" data-testid="h2-quick-comparison-buildertrend">
                Quick Comparison Table
              </h2>
              <div className="overflow-x-auto mb-16">
                <table className="w-full border-collapse bg-white rounded-xl border border-slate-200" data-testid="table-comparison-buildertrend">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900 border-b">Feature</th>
                      <th className="text-center py-4 px-6 font-semibold text-orange-600 border-b">ScopeGen</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-600 border-b">Buildertrend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Starting Price</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">Free tier available</td>
                      <td className="py-4 px-6 text-center text-slate-600">$499/month</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Proposal Generation</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">60 seconds</td>
                      <td className="py-4 px-6 text-center text-slate-600">Manual</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Pre-built Templates</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">17+ trades</td>
                      <td className="py-4 px-6 text-center text-slate-600">Limited</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">E-signatures</td>
                      <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Best For</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">Small contractors</td>
                      <td className="py-4 px-6 text-center text-slate-600">Large construction companies</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Setup Time</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">5 minutes</td>
                      <td className="py-4 px-6 text-center text-slate-600">Days to weeks</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-slate-700">Learning Curve</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">Minimal</td>
                      <td className="py-4 px-6 text-center text-slate-600">Steep</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-what-is-scopegen">
                  What is ScopeGen?
                </h2>
                <p className="text-slate-600 mb-8">
                  ScopeGen is a proposal generator built specifically for contractors who need professional proposals fast. With pre-built scope templates for 17+ trades including roofing, HVAC, plumbing, electrical, remodeling, and more, you can create a complete proposal in about 60 seconds. There&apos;s no complex setup, no training required, and a free tier available to get started immediately.
                </p>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-what-is-buildertrend">
                  What is Buildertrend?
                </h2>
                <p className="text-slate-600 mb-8">
                  Buildertrend is a comprehensive construction management platform designed for larger construction companies. It includes project management, scheduling, financials, client communication, and proposal tools all in one system. Starting at $499/month after a trial period, it&apos;s built for companies that need enterprise-level features and are willing to invest time in setup and training.
                </p>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-key-differences-buildertrend">
                  Key Differences
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Pricing</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen offers a free tier with paid plans starting much lower. Buildertrend starts at $499/month, which can be cost-prohibitive for smaller operations.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Ease of Use</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen is ready to use in minutes with no training. Buildertrend requires significant setup time and has a steep learning curve.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Target Audience</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen is perfect for solo operators and small teams. Buildertrend targets larger construction companies with multiple crews.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Feature Focus</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen focuses exclusively on creating winning proposals. Buildertrend is a full project management suite where proposals are just one feature.
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-when-scopegen-buildertrend">
                  When to Choose ScopeGen
                </h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You&apos;re a small contractor or solo operator
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You want proposals done in under a minute
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You focus on remodeling, roofing, HVAC, plumbing, electrical, or similar trades
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You don&apos;t want to pay for features you don&apos;t need
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    You need to get started today without weeks of setup
                  </li>
                </ul>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-when-buildertrend">
                  When to Choose Buildertrend
                </h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You run a larger construction company with multiple crews
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You need comprehensive project management, scheduling, and financials
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    Your budget allows for $499+/month software investment
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You have time for extensive setup and team training
                  </li>
                </ul>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-bottom-line-buildertrend">
                  The Bottom Line
                </h2>
                <p className="text-slate-600 mb-8">
                  If you&apos;re a small to medium contractor who just wants to create professional proposals quickly and affordably, ScopeGen is the clear choice. You&apos;ll be up and running in minutes instead of weeks, and you won&apos;t pay for project management features you don&apos;t need. Try ScopeGen free and see for yourself.
                </p>
              </div>

              <div className="text-center py-8">
                <Link href="/app">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-cta-buildertrend">
                    Create Your First Proposal Free <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>
    </LayoutWrapper>
  );
}
