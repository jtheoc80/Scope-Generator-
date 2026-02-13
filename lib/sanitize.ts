/**
 * HTML Sanitization Utility
 * 
 * Uses sanitize-html to sanitize HTML and prevent XSS attacks.
 * Pure Node.js — no jsdom dependency, works reliably on Vercel.
 */
import sanitize from 'sanitize-html';

/**
 * Configuration for allowed HTML elements and attributes.
 * This is a restrictive allowlist for blog content.
 */
const BLOG_CONTENT_CONFIG: sanitize.IOptions = {
  allowedTags: [
    'strong', 'b', 'em', 'i', 'u', 's',
    'a', 'code', 'pre', 'br',
    'p', 'span', 'div',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'hr',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    '*': ['class', 'id', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

/**
 * Sanitize HTML content for safe rendering.
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 * 
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * ```
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, BLOG_CONTENT_CONFIG);
}

/**
 * Sanitize and process markdown-like content to HTML.
 * Applies common transformations (bold, links, code) and then sanitizes.
 * 
 * @param text - The text with markdown-like syntax
 * @returns Sanitized HTML string
 */
export function processMarkdownToSafeHtml(text: string): string {
  const processed = text
    // Bold text **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm">$1</code>');
  
  return sanitize(processed, BLOG_CONTENT_CONFIG);
}
