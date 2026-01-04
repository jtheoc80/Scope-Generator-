import React from 'react';
import Link from 'next/link';

/**
 * Validate URL for safety - prevents javascript:, data:, and other dangerous protocols
 */
function isValidUrl(url: string): boolean {
  const trimmedUrl = url.trim().toLowerCase();
  // Only allow http, https, and relative URLs (case-insensitive check)
  return trimmedUrl.startsWith('http://') || 
         trimmedUrl.startsWith('https://') || 
         url.trim().startsWith('/');
}

/**
 * Safely parse and render inline formatting (bold, links, inline code) without dangerouslySetInnerHTML.
 * This function parses a string and returns an array of React elements.
 */
export function parseInlineFormatting(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match bold text: **text** (using specific character classes to prevent ReDoS)
    const boldMatch = remaining.match(/^([^*]*)\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch[1] !== undefined && boldMatch[2] !== undefined) {
      if (boldMatch[1]) {
        result.push(<span key={key++}>{boldMatch[1]}</span>);
      }
      result.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Match links: [text](url) (using specific character classes to prevent ReDoS)
    const linkMatch = remaining.match(/^([^\[]*)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch[1] !== undefined && linkMatch[2] !== undefined && linkMatch[3] !== undefined) {
      if (linkMatch[1]) {
        result.push(<span key={key++}>{linkMatch[1]}</span>);
      }
      const href = linkMatch[3];
      // Validate URL for safety
      if (isValidUrl(href)) {
        if (href.startsWith('/')) {
          result.push(
            <Link key={key++} href={href} className="text-orange-600 hover:underline">
              {linkMatch[2]}
            </Link>
          );
        } else {
          result.push(
            <a key={key++} href={href} className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {linkMatch[2]}
            </a>
          );
        }
      } else {
        // If URL is invalid, render as plain text
        result.push(<span key={key++}>[{linkMatch[2]}]({href})</span>);
      }
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Match inline code: `code` (using specific character classes to prevent ReDoS)
    const codeMatch = remaining.match(/^([^`]*)`([^`]+)`/);
    if (codeMatch && codeMatch[1] !== undefined && codeMatch[2] !== undefined) {
      if (codeMatch[1]) {
        result.push(<span key={key++}>{codeMatch[1]}</span>);
      }
      result.push(
        <code key={key++} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">
          {codeMatch[2]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // No more special formatting, add the rest
    result.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return result;
}

/**
 * Parse table cell content with bold formatting support
 */
export function parseTableCell(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text.trim();
  let key = 0;

  while (remaining.length > 0) {
    // Match bold text: **text** (using specific character classes to prevent ReDoS)
    const boldMatch = remaining.match(/^([^*]*)\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch[1] !== undefined && boldMatch[2] !== undefined) {
      if (boldMatch[1]) {
        result.push(<span key={key++}>{boldMatch[1]}</span>);
      }
      result.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // No more special formatting, add the rest
    result.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return result;
}
