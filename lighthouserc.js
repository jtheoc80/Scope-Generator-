/**
 * Lighthouse CI configuration for QA Agent.
 * 
 * Runs performance, accessibility, and SEO audits on key pages.
 */
module.exports = {
  ci: {
    collect: {
      url: [
        '/',
        '/sign-in',
        '/sign-up',
        '/dashboard',
        '/generator',
      ],
      numberOfRuns: process.env.CI ? 3 : 1,
      settings: {
        preset: 'desktop',
        // Throttle settings for consistent CI results
        throttlingMethod: 'simulate',
        // Only run specific categories for speed
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './qa/reports/lighthouse',
    },
    assert: {
      assertions: {
        // Performance thresholds (relaxed for smoke tests)
        'categories:performance': ['warn', { minScore: 0.5 }],
        // Accessibility must pass
        'categories:accessibility': ['error', { minScore: 0.8 }],
        // SEO baseline
        'categories:seo': ['warn', { minScore: 0.7 }],
        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.7 }],
        // Specific audits
        'color-contrast': 'warn',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-description': 'warn',
        'viewport': 'error',
      },
    },
  },
};
