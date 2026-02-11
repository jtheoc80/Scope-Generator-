/**
 * JSON-LD Structured Data Components
 *
 * IMPORTANT: These use server-rendered <script> tags (not next/script with
 * strategy="afterInteractive") so that Googlebot can read them on the initial
 * HTML response without executing JavaScript.
 */

interface OrganizationJsonLdProps {
  type?: 'Organization' | 'SoftwareApplication';
}

export function OrganizationJsonLd({ type = 'Organization' }: OrganizationJsonLdProps) {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ScopeGen',
    alternateName: 'Lead Ledger Pro LLC',
    url: 'https://scopegenerator.com',
    logo: 'https://scopegenerator.com/scopegen-og-dark.png',
    description: 'Professional contractor proposal software. Generate proposals and scopes of work in seconds.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Houston',
      addressRegion: 'TX',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@scopegenerator.com',
      contactType: 'customer service',
    },
    // TODO: Add your social media profile URLs here for Google Knowledge Panel.
    // Example: ['https://www.linkedin.com/company/scopegen', 'https://twitter.com/scopegen']
    sameAs: [],
  };

  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ScopeGen',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Professional contractor proposal software. Generate proposals and scopes of work in seconds for kitchen and bathroom remodels, electrical, HVAC, plumbing, and more.',
    url: 'https://scopegenerator.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
    // WARNING: aggregateRating must reflect real, collected user reviews.
    // Google may issue a manual action (penalty) for fabricated review data.
    // Remove this block if ratings are not based on verified reviews.
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '500',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      '60-second proposal generation',
      '17+ trade templates',
      'E-signature support',
      'PDF download',
      'Regional pricing adjustments',
    ],
  };

  const data = type === 'SoftwareApplication' ? softwareData : organizationData;

  // Use a plain <script> tag so the JSON-LD is in the initial HTML response
  // and visible to search engine crawlers that don't execute JavaScript.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface WebPageJsonLdProps {
  title: string;
  description: string;
  url: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function WebPageJsonLd({ title, description, url, breadcrumbs }: WebPageJsonLdProps) {
  const webPageData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: url,
    publisher: {
      '@type': 'Organization',
      name: 'ScopeGen',
      url: 'https://scopegenerator.com',
    },
  };

  const breadcrumbData = breadcrumbs ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
      />
      {breadcrumbData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
      )}
    </>
  );
}

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author,
}: ArticleJsonLdProps) {
  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: url,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ScopeGen',
      url: 'https://scopegenerator.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://scopegenerator.com/scopegen-og-dark.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
    />
  );
}

interface FAQJsonLdProps {
  questions: Array<{ question: string; answer: string }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  );
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  price: string;
  priceCurrency?: string;
}

export function ProductJsonLd({
  name,
  description,
  price,
  priceCurrency = 'USD',
}: ProductJsonLdProps) {
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    brand: {
      '@type': 'Brand',
      name: 'ScopeGen',
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: priceCurrency,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
    />
  );
}
