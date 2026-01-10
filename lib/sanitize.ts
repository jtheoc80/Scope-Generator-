/**
 * HTML Sanitization Utility
 * 
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks.
 * Works in both server and client environments (isomorphic).
 */
import DOMPurify, { Config } from 'isomorphic-dompurify';

/**
 * Configuration for allowed HTML elements and attributes.
 * This is a restrictive allowlist for blog content.
 */
const BLOG_CONTENT_CONFIG: Config = {
  ALLOWED_TAGS: [
    'strong', 'b', 'em', 'i', 'u', 's',
    'a', 'code', 'pre', 'br',
    'p', 'span', 'div',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'hr',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'id',
    'style', // Allow inline styles for tables
  ],
  // Force all links to open in new tab with safe attributes
  ADD_ATTR: ['target', 'rel'],
  // Don't allow data: or javascript: URLs
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  // Return string instead of TrustedHTML
  RETURN_TRUSTED_TYPE: false,
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
  return DOMPurify.sanitize(html, BLOG_CONTENT_CONFIG) as string;
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
  
  return DOMPurify.sanitize(processed, BLOG_CONTENT_CONFIG) as string;
}
