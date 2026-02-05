import { Metadata } from "next";
import LayoutWrapper from "@/components/layout-wrapper";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/blog-data";
import { generateBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Contractor Blog | Proposal Tips & Business Advice | ScopeGenerator",
  description: "Free resources for contractors: proposal writing tips, pricing guides, scope of work templates, and business advice to help you win more jobs.",
  keywords: [
    "contractor blog",
    "proposal writing tips",
    "contractor pricing guide",
    "scope of work templates",
    "contractor business advice",
    "construction proposal tips",
  ],
  alternates: {
    canonical: "https://scopegenerator.com/blog",
  },
  openGraph: {
    title: "Contractor Blog | Proposal Tips & Business Advice | ScopeGenerator",
    description: "Free resources for contractors: proposal writing tips, pricing guides, scope of work templates, and business advice to help you win more jobs.",
    url: "https://scopegenerator.com/blog",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "ScopeGenerator Contractor Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contractor Blog | Proposal Tips & Business Advice",
    description: "Free resources for contractors: proposal writing tips, pricing guides, and business advice.",
    images: ["/opengraph.jpg"],
  },
};

export default function BlogIndex() {
  const posts = Object.values(blogPosts).sort((a, b) => 
    new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
  );

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

  // Get the most recent post as featured
  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  // Group posts by category
  const categories = [...new Set(posts.map(p => p.category))];

  return (
    <LayoutWrapper>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="blog-title">
              Contractor Resources
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              Practical advice on proposals, pricing, and winning more jobs—written by contractors, for contractors.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <span 
                  key={category}
                  className="text-sm bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <span className="text-sm font-medium text-orange-600 mb-4 block">Latest Post</span>
              <Link href={`/blog/${featuredPost.slug}`}>
                <article className="group grid md:grid-cols-2 gap-8 items-center">
                  {/* Image */}
                  <div className="relative h-64 md:h-80 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl overflow-hidden">
                    {featuredPost.heroImage ? (
                      <Image
                        src={featuredPost.heroImage}
                        alt={featuredPost.heroImageAlt || featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-20">📝</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {featuredPost.datePublished}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-4">
                      {featuredPost.title}
                    </h2>
                    <p className="text-slate-600 mb-4 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{featuredPost.author.name}</p>
                          <p className="text-xs text-slate-500">{featuredPost.author.credentials}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center text-orange-600 font-medium group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">All Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {regularPosts.map((post) => (
                <article 
                  key={post.slug} 
                  className="bg-white rounded-xl border hover:border-orange-300 hover:shadow-lg transition-all overflow-hidden group"
                  data-testid={`blog-post-${post.slug}`}
                >
                  <Link href={`/blog/${post.slug}`}>
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                      {post.heroImage ? (
                        <Image
                          src={post.heroImage}
                          alt={post.heroImageAlt || post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl opacity-20">📝</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 text-slate-700 text-xs px-2 py-1 rounded font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.datePublished}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-600">{post.author.name}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="py-12 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tools & Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/calculator" 
                className="p-5 bg-slate-50 rounded-lg border hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
              >
                <div className="text-2xl mb-2">🧮</div>
                <h3 className="font-semibold text-slate-900 group-hover:text-orange-600">Cost Calculator</h3>
                <p className="text-sm text-slate-600 mt-1">Get instant project estimates</p>
              </Link>
              <Link 
                href="/contractor-estimate-generator" 
                className="p-5 bg-slate-50 rounded-lg border hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
              >
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-slate-900 group-hover:text-orange-600">Estimate Generator</h3>
                <p className="text-sm text-slate-600 mt-1">Create professional estimates</p>
              </Link>
              <Link 
                href="/scope-of-work-generator" 
                className="p-5 bg-slate-50 rounded-lg border hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
              >
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-semibold text-slate-900 group-hover:text-orange-600">Scope Generator</h3>
                <p className="text-sm text-slate-600 mt-1">Build detailed scopes of work</p>
              </Link>
              <Link 
                href="/scopescan" 
                className="p-5 bg-slate-50 rounded-lg border hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
              >
                <div className="text-2xl mb-2">📸</div>
                <h3 className="font-semibold text-slate-900 group-hover:text-orange-600">ScopeScan</h3>
                <p className="text-sm text-slate-600 mt-1">Photo-to-scope AI tool</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-4 text-white">
              Ready to Create Better Proposals?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Stop writing proposals from scratch. Use our trade-specific templates to create professional proposals in minutes.
            </p>
            <Link href="/app">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2" 
                data-testid="blog-cta"
              >
                Try ScopeGen Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LayoutWrapper>
  );
}
