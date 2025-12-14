'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/blog-data";

export default function BlogIndex() {
  useEffect(() => {
    document.title = "Contractor Blog | Proposal Tips & Business Advice | ScopeGen";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Free resources for contractors: proposal writing tips, pricing guides, scope of work templates, and business advice to help you win more jobs.");
    }
  }, []);

  const posts = Object.values(blogPosts).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="blog-title">
              Contractor Resources
            </h1>
            <p className="text-xl text-slate-300">
              Proposal tips, pricing guides, and business advice to help you win more jobs.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {posts.map((post) => (
                <article key={post.slug} className="border-b border-slate-200 pb-8" data-testid={`blog-post-${post.slug}`}>
                  <Link href={`/blog/${post.slug}`}>
                    <div className="group cursor-pointer">
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                          {post.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-3">
                        {post.title}
                      </h2>
                      <p className="text-slate-600 mb-4">{post.excerpt}</p>
                      <span className="inline-flex items-center text-orange-600 font-medium group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-4">Ready to Create Better Proposals?</h2>
            <p className="text-lg text-slate-600 mb-8">
              Stop writing proposals from scratch. Use our trade-specific templates to create professional proposals in minutes.
            </p>
            <Link href="/app">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="blog-cta">
                Try ScopeGen Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
