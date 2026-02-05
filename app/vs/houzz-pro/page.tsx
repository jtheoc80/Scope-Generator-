'use client';
import { useEffect } from "react";
import LayoutWrapper from "@/components/layout-wrapper";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompareHouzz() {
  useEffect(() => {
    document.title = "ScopeGen vs Houzz Pro: Which Proposal Software is Right for You?";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Compare ScopeGen vs Houzz Pro for contractor proposals. See the differences in pricing, features, and find out which tool is best for your business.");
    }
  }, []);

  return (
    <LayoutWrapper>
      <article className="bg-white">
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6" data-testid="h1-compare-houzz">
                ScopeGen vs Houzz Pro: Which Proposal Software is Right for You?
              </h1>
              <p className="text-xl text-slate-300 mb-8" data-testid="text-intro-houzz">
                Both ScopeGen and Houzz Pro help contractors create proposals, but they serve different markets and purposes. ScopeGen is a fast, focused proposal generator for all contractor trades, while Houzz Pro is a design and project management platform built around the Houzz ecosystem. Let&apos;s compare.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 text-center" data-testid="h2-quick-comparison-houzz">
                Quick Comparison Table
              </h2>
              <div className="overflow-x-auto mb-16">
                <table className="w-full border-collapse bg-white rounded-xl border border-slate-200" data-testid="table-comparison-houzz">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-900 border-b">Feature</th>
                      <th className="text-center py-4 px-6 font-semibold text-orange-600 border-b">ScopeGen</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-600 border-b">Houzz Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">Starting Price</td>
                      <td className="py-4 px-6 text-center text-orange-600 font-medium">Free tier available</td>
                      <td className="py-4 px-6 text-center text-slate-600">$149/month</td>
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
                      <td className="py-4 px-6 text-center text-slate-600">Interior designers & remodelers</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700">3D Design Tools</td>
                      <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-slate-700">Lead Generation</td>
                      <td className="py-4 px-6 text-center text-slate-600">Not included</td>
                      <td className="py-4 px-6 text-center text-slate-600">Paid extra</td>
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

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-what-is-houzz">
                  What is Houzz Pro?
                </h2>
                <p className="text-slate-600 mb-8">
                  Houzz Pro is a design and project management platform primarily for interior designers and remodelers. Starting at $149/month, it includes 3D design tools, mood boards, lead generation through the Houzz marketplace, and proposal features. It&apos;s deeply integrated with the Houzz ecosystem, which is great if you want leads from Houzz but requires commitment to their platform.
                </p>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-key-differences-houzz">
                  Key Differences
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Pricing</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen offers a free tier with affordable paid plans. Houzz Pro starts at $149/month, plus additional costs for premium lead generation.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Ease of Use</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen is ready to use in 5 minutes. Houzz Pro requires learning their design tools and understanding the Houzz ecosystem.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Target Audience</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen works for any contractor trade. Houzz Pro is specifically designed for interior designers and renovation professionals.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-2">Feature Focus</h3>
                    <p className="text-slate-600 text-sm">
                      ScopeGen focuses on fast, professional proposals. Houzz Pro combines design visualization with lead generation and project management.
                    </p>
                  </div>
                </div>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-when-scopegen-houzz">
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
                    You generate your own leads and don&apos;t need the Houzz marketplace
                  </li>
                </ul>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-when-houzz">
                  When to Choose Houzz Pro
                </h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You&apos;re an interior designer or high-end remodeler
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You need 3D design visualization and mood boards for clients
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    You want to generate leads through the Houzz marketplace
                  </li>
                  <li className="flex items-start gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    Your business model relies on showcasing design portfolios
                  </li>
                </ul>

                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4" data-testid="h2-bottom-line-houzz">
                  The Bottom Line
                </h2>
                <p className="text-slate-600 mb-8">
                  If you&apos;re a contractor who needs fast, professional proposals without being tied to a specific ecosystem, ScopeGen is the smart choice. You&apos;ll get industry-leading proposal generation without paying for 3D design tools or marketplace leads you may not need. Try ScopeGen free and see for yourself.
                </p>
              </div>

              <div className="text-center py-8">
                <Link href="/app">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="button-cta-houzz">
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
