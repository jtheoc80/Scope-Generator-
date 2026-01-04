import { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/layout";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Calendar, Clock, Zap, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts, getRelatedPosts } from "@/lib/blog-data";
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo/jsonld";
import { 
  BlogHero, 
  TableOfContents, 
  AuthorCard,
  InlineCTA,
  Callout,
  Checklist,
  RelatedPosts,
  extractTOC
} from "@/components/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return {
      title: "Article Not Found | ScopeGenerator",
    };
  }

  const ogImageUrl = post.ogImage || post.heroImage || "/opengraph.jpg";

  return {
    title: `${post.metaTitle} | ScopeGenerator`,
    description: post.metaDescription,
    keywords: [
      post.category.toLowerCase(),
      ...post.tags,
      "contractor",
      "proposal",
    ],
    authors: [{ name: post.author.name }],
    alternates: {
      canonical: post.canonical || `https://scopegenerator.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://scopegenerator.com/blog/${post.slug}`,
      type: "article",
      publishedTime: new Date(post.datePublished).toISOString(),
      modifiedTime: new Date(post.dateModified).toISOString(),
      authors: [post.author.name],
      section: post.category,
      tags: post.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.heroImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [ogImageUrl],
    },
  };
}

// Content renderer that handles markdown-like syntax
function renderContent(content: string[], inlineCTAIndex: number) {
  const elements: React.ReactNode[] = [];
  let ctaInserted = false;

  for (let i = 0; i < content.length; i++) {
    const block = content[i];

    // Insert inline CTA roughly 40% through the content
    if (!ctaInserted && i >= inlineCTAIndex) {
      elements.push(<InlineCTA key={`cta-${i}`} />);
      ctaInserted = true;
    }

    // Headings
    if (block.startsWith("## ")) {
      const text = block.replace("## ", "");
      const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      elements.push(
        <h2 key={i} id={id} className="scroll-mt-24">
          {text}
        </h2>
      );
      continue;
    }

    if (block.startsWith("### ")) {
      const text = block.replace("### ", "");
      const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      elements.push(
        <h3 key={i} id={id} className="scroll-mt-24">
          {text}
        </h3>
      );
      continue;
    }

    // Code blocks
    if (block.startsWith("```")) {
      const codeContent = block.replace(/^```\w*\n?/, "").replace(/```$/, "");
      elements.push(
        <pre key={i} className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
          <code>{codeContent}</code>
        </pre>
      );
      continue;
    }

    // Tables
    if (block.includes("|") && block.includes("\n")) {
      const lines = block.trim().split("\n");
      const headerRow = lines[0].split("|").filter((cell) => cell.trim());
      const dataRows = lines.slice(2).map((line) =>
        line.split("|").filter((cell) => cell.trim())
      );

      elements.push(
        <div key={i} className="my-6 overflow-x-auto">
          <table className="min-w-full border-collapse border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                {headerRow.map((cell, j) => (
                  <th
                    key={j}
                    className="border border-slate-200 px-4 py-2 text-left font-semibold text-slate-700"
                  >
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="even:bg-slate-50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-slate-200 px-4 py-2 text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html: cell
                          .trim()
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered lists
    if (block.startsWith("- ") || block.startsWith("* ")) {
      const items = block.split("\n").filter((line) => line.match(/^[-*] /));
      elements.push(
        <ul key={i}>
          {items.map((line, j) => (
            <li
              key={j}
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/^[-*] /, "")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'),
              }}
            />
          ))}
        </ul>
      );
      continue;
    }

    // Checkbox lists (special rendering)
    if (block.includes("- [ ]") || block.includes("- [x]")) {
      const items = block.split("\n").filter((line) => line.match(/^- \[[x ]\]/));
      elements.push(
        <div key={i} className="my-6 p-5 bg-slate-50 rounded-lg border">
          <ul className="space-y-2">
            {items.map((line, j) => {
              const isChecked = line.includes("[x]");
              const text = line.replace(/^- \[[x ]\] /, "");
              return (
                <li key={j} className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      isChecked
                        ? "bg-green-500 border-green-500"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="text-slate-700">{text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (block === "---") {
      elements.push(<hr key={i} />);
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p
        key={i}
        dangerouslySetInnerHTML={{
          __html: block
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm">$1</code>'),
        }}
      />
    );
  }

  return elements;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);
  const inlineCTAIndex = Math.floor(post.content.length * 0.4);
  const tocItems = extractTOC(post.content);

  // Generate structured data
  const articleSchema = generateArticleSchema({
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    url: `https://scopegenerator.com/blog/${post.slug}`,
    datePublished: new Date(post.datePublished).toISOString(),
    dateModified: new Date(post.dateModified).toISOString(),
    author: post.author.name,
    type: "BlogPosting",
    image: post.heroImage
      ? `https://scopegenerator.com${post.heroImage}`
      : post.ogImage
        ? `https://scopegenerator.com${post.ogImage}`
        : undefined,
  });

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  // Generate FAQ schema if post has FAQs
  const faqSchema =
    post.faqs && post.faqs.length > 0 ? generateFAQSchema(post.faqs) : null;

  return (
    <Layout>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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
                  {post.datePublished}
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
              
              {/* Author Byline - E-E-A-T Signal */}
              <div className="mt-6 pt-6 border-t border-slate-700 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{post.author.name}</p>
                  <p className="text-sm text-slate-400">Construction Industry Expert</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        {post.heroImage && (
          <div className="bg-slate-100">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto -mt-8 relative">
                <div className="rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src={post.heroImage}
                    alt={post.title}
                    width={1200}
                    height={630}
                    priority
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-center text-sm text-slate-500 mt-3 italic">
                  Pricing confidence comes from knowing your numbers and presenting them clearly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated Notice - E-E-A-T Signal */}
        <div className="bg-slate-100 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-600">
              <RefreshCw className="h-4 w-4" />
              <span>Last updated: {post.dateModified}</span>
            </div>
          </div>
        </div>

        {/* Last Updated Notice */}
        {post.dateModified !== post.datePublished && (
          <div className="bg-slate-100 border-b">
            <div className="container mx-auto px-4 py-3">
              <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-600">
                <RefreshCw className="h-4 w-4" />
                <span>Last updated: {post.dateModified}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
                {/* Article Content */}
                <div className="max-w-3xl">
                  {/* Mobile TOC */}
                  {tocItems.length >= 3 && (
                    <div className="lg:hidden mb-8">
                      <TableOfContents items={tocItems} variant="inline" />
                    </div>
                  )}

                  {/* Prose Content */}
                  <div
                    className="prose prose-lg prose-slate max-w-none
                      prose-headings:font-display prose-headings:font-bold
                      prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                      prose-p:text-slate-600 prose-p:leading-relaxed
                      prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-slate-900
                      prose-li:text-slate-600
                      prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:bg-slate-900 prose-pre:text-slate-100
                      prose-table:border-collapse
                      prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-th:px-4 prose-th:py-2
                      prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-2"
                    data-testid="blog-post-content"
                  >
                    {renderContent(post.content, inlineCTAIndex)}
                  </div>

                  {/* Author Card (Footer) */}
                  <div className="mt-12 pt-8 border-t">
                    <AuthorCard
                      author={post.author}
                      datePublished={post.datePublished}
                      dateModified={post.dateModified}
                      readTime={post.readTime}
                      variant="footer"
                    />
                  </div>
                </div>

                {/* Desktop Sidebar with TOC */}
                {tocItems.length >= 3 && (
                  <aside className="hidden lg:block">
                    <TableOfContents
                      items={tocItems}
                      variant="sidebar"
                      className="sticky top-24"
                    />

                    {/* Sidebar CTA */}
                    <div className="mt-8 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                      <p className="font-semibold text-slate-900 text-sm mb-2">
                        Create proposals faster
                      </p>
                      <p className="text-xs text-slate-600 mb-3">
                        Generate professional contractor proposals in minutes.
                      </p>
                      <Link href="/app">
                        <Button
                          size="sm"
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Try Free <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        {post.faqs && post.faqs.length > 0 && (
          <div className="py-12 bg-slate-50 border-t">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {post.faqs.map((faq, index) => (
                    <details
                      key={index}
                      className="bg-white rounded-lg border p-4 group"
                    >
                      <summary 
                        className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between"
                        aria-label="Toggle FAQ answer"
                      >
                        {faq.question}
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <p className="mt-3 text-slate-600">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="py-12 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">
                  Create Professional Proposals in Minutes
                </h2>
                <p className="text-orange-100 mb-6">
                  Stop spending hours writing proposals. ScopeGen has
                  trade-specific templates ready to go.
                </p>
                <Link href="/app">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-orange-50"
                    data-testid="blog-post-cta"
                  >
                    Try ScopeGen Free <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <RelatedPosts
            posts={relatedPosts.map((p) => ({
              slug: p.slug,
              title: p.title,
              excerpt: p.excerpt,
              category: p.category,
              readTime: p.readTime,
              heroImage: p.heroImage,
            }))}
          />
        )}
      </article>
    </Layout>
  );
}
