export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  content: string[];
}

export const blogPosts: Record<string, BlogPost> = {
  "how-to-write-bathroom-remodel-proposal": {
    slug: "how-to-write-bathroom-remodel-proposal",
    title: "How to Write a Bathroom Remodel Proposal That Wins Jobs",
    excerpt: "Learn the essential elements every bathroom remodeling proposal needs to close more deals and set proper client expectations.",
    author: "ScopeGen Team",
    date: "December 5, 2025",
    readTime: "6 min read",
    category: "Proposal Writing",
    metaTitle: "How to Write a Bathroom Remodel Proposal | Complete Guide",
    metaDescription: "Step-by-step guide to writing professional bathroom remodeling proposals. Includes scope of work examples, pricing tips, and templates.",
    content: [
      "A well-written bathroom remodel proposal is the difference between winning the job and losing to a competitor.",
    ]
  },
  "contractor-pricing-guide-2025": {
    slug: "contractor-pricing-guide-2025",
    title: "Contractor Pricing Guide 2025: How to Price Your Services",
    excerpt: "Learn how to price your contracting services competitively while maintaining healthy profit margins in 2025.",
    author: "ScopeGen Team",
    date: "December 3, 2025",
    readTime: "8 min read",
    category: "Business Tips",
    metaTitle: "Contractor Pricing Guide 2025 | How to Price Your Services",
    metaDescription: "Complete 2025 guide to pricing contractor services.",
    content: [
      "Pricing your contracting services correctly is one of the most critical decisions you will make.",
    ]
  },
  "scope-of-work-template-examples": {
    slug: "scope-of-work-template-examples",
    title: "Scope of Work Template Examples for Contractors",
    excerpt: "Free scope of work templates and examples for bathroom, kitchen, roofing, painting, and other contractor trades.",
    author: "ScopeGen Team",
    date: "December 1, 2025",
    readTime: "10 min read",
    category: "Templates",
    metaTitle: "Scope of Work Template Examples | Free Contractor Templates",
    metaDescription: "Free scope of work templates for contractors.",
    content: [
      "A good scope of work protects both you and your client.",
    ]
  },
  "win-more-contractor-bids": {
    slug: "win-more-contractor-bids",
    title: "5 Ways to Win More Contractor Bids (Without Lowering Your Price)",
    excerpt: "Learn proven strategies to win more contracting jobs without sacrificing your profit margins.",
    author: "ScopeGen Team",
    date: "November 28, 2025",
    readTime: "5 min read",
    category: "Business Tips",
    metaTitle: "How to Win More Contractor Bids | 5 Proven Strategies",
    metaDescription: "Win more contracting jobs without cutting prices.",
    content: [
      "Every contractor knows the frustration of losing bids.",
    ]
  },
};

export const blogSlugs = Object.keys(blogPosts);
