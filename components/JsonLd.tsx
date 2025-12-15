import Script from 'next/script';

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
    logo: 'https://scopegenerator.com/opengraph.jpg',
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
    sameAs: [],
  };

  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ScopeGen',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Professional contractor proposal software. Generate proposals and scopes of work in seconds for bathroom remodels, roofing, HVAC, plumbing, electrical, and more.',
    url: 'https://scopegenerator.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
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

  return (
    <Script
      id={`jsonld-${type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
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
      <Script
        id="jsonld-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
        strategy="afterInteractive"
      />
      {breadcrumbData && (
        <Script
          id="jsonld-breadcrumbs"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
          strategy="afterInteractive"
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
        url: 'https://scopegenerator.com/opengraph.jpg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <Script
      id="jsonld-article"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      strategy="afterInteractive"
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
    <Script
      id="jsonld-faq"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      strategy="afterInteractive"
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
    <Script
      id="jsonld-product"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      strategy="afterInteractive"
    />
  );
}
