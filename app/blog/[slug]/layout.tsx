import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";

interface BlogPostLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

function toIsoOrUndefined(value: string): string | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function generateMetadata({ params }: BlogPostLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  
  if (!post) {
    return {
      title: "Article Not Found | ScopeGenerator",
      description: "The requested blog article could not be found.",
    };
  }

  // Use post-specific OG image if available, otherwise default
  const ogImage = post.ogImage 
    ? `https://scopegenerator.com${post.ogImage}`
    : post.heroImage 
      ? `https://scopegenerator.com${post.heroImage}`
      : "https://scopegenerator.com/scopegen-og-dark.png";
  const publishedTime = toIsoOrUndefined(post.datePublished);
  const modifiedTime = toIsoOrUndefined(post.dateModified);

  return {
    title: `${post.metaTitle} | ScopeGenerator`,
    description: post.metaDescription,
    keywords: [
      post.category.toLowerCase(),
      ...post.tags,
      "contractor",
      "proposal",
      "scope of work",
    ],
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://scopegenerator.com/blog/${post.slug}`,
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [post.author.name],
      section: post.category,
      tags: post.tags,
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
    alternates: {
      canonical: post.canonical || `https://scopegenerator.com/blog/${post.slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
