'use client';
import { useEffect } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/blog-data";

function InlineCTA() {
  return (
    <div className="my-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-secondary rounded-r-lg">
      <div className="flex items-start gap-4">
        <div className="bg-secondary p-2 rounded-full flex-shrink-0">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-slate-900 mb-1">Skip the writing. Generate this proposal automatically.</p>
          <p className="text-slate-600 text-sm mb-3">ScopeGen creates professional contractor proposals in about 60 seconds.</p>
          <Link href="/app">
            <Button size="sm" className="bg-secondary text-slate-900 hover:bg-secondary/90" data-testid="inline-cta">
              Try It Free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getRelatedPosts(currentSlug: string, currentCategory: string) {
  const allPosts = Object.values(blogPosts);
  
  const sameCategoryPosts = allPosts.filter(
    p => p.slug !== currentSlug && p.category === currentCategory
  );
  
  const otherPosts = allPosts.filter(
    p => p.slug !== currentSlug && p.category !== currentCategory
  );
  
  const related = [...sameCategoryPosts, ...otherPosts].slice(0, 3);
  return related;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const post = blogPosts[slug];

  useEffect(() => {
    if (post) {
      document.title = post.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", post.metaDescription);
      }
    }
  }, [post]);

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <Link href="/blog">
            <Button className="mt-4">Back to Blog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedPosts = getRelatedPosts(slug, post.category);
  const inlineCTAIndex = Math.floor(post.content.length * 0.4);

  return (
    <Layout>
      <article>
        <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Link href="/blog">
                <Button variant="ghost" className="text-slate-300 hover:text-white mb-6 -ml-4" data-testid="blog-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
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
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4" data-testid="blog-post-title">
                {post.title}
              </h1>
              <p className="text-lg text-slate-300">{post.excerpt}</p>
            </div>
          </div>
        </header>

        <div className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg prose-slate prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-orange-600" data-testid="blog-post-content">
              {post.content.map((block, i) => {
                const elements = [];
                
                if (i === inlineCTAIndex) {
                  elements.push(<InlineCTA key={`cta-${i}`} />);
                }
                
                if (block.startsWith("## ")) {
                  elements.push(<h2 key={i}>{block.replace("## ", "")}</h2>);
                } else if (block.startsWith("### ")) {
                  elements.push(<h3 key={i}>{block.replace("### ", "")}</h3>);
                } else if (block.startsWith("- ")) {
                  elements.push(
                    <ul key={i}>
                      {block.split("\n").filter(line => line.startsWith("- ")).map((line, j) => (
                        <li key={j}>{line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, (_, text) => text)}</li>
                      ))}
                    </ul>
                  );
                } else if (block === "---") {
                  elements.push(<hr key={i} />);
                } else {
                  elements.push(
                    <p key={i} dangerouslySetInnerHTML={{ 
                      __html: block
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
                    }} />
                  );
                }
                
                return elements;
              })}
            </div>
          </div>
        </div>

        <div className="py-12 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">Create Professional Proposals in Minutes</h2>
                <p className="text-orange-100 mb-6">
                  Stop spending hours writing proposals. ScopeGen has trade-specific templates ready to go.
                </p>
                <Link href="/app">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50" data-testid="blog-post-cta">
                    Try ScopeGen Free <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="py-12 bg-white border-t">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Related Articles</h3>
                <div className="grid gap-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                      <div className="p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {relatedPost.category}
                          </span>
                          <span className="text-xs text-slate-400">{relatedPost.readTime}</span>
                        </div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{relatedPost.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/blog">
                    <Button variant="outline" data-testid="view-all-posts">
                      View All Articles <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}
