import React from 'react';
import Link from 'next/link';

/**
 * Safely parse and render inline formatting (bold, links, inline code) without dangerouslySetInnerHTML.
 * This function parses a string and returns an array of React elements.
 */
export function parseInlineFormatting(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match bold text: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) {
        result.push(<span key={key++}>{boldMatch[1]}</span>);
      }
      result.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Match links: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      if (linkMatch[1]) {
        result.push(<span key={key++}>{linkMatch[1]}</span>);
      }
      // Check if it's an internal link
      const href = linkMatch[3];
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
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Match inline code: `code`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    if (codeMatch) {
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
    // Match bold text: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/);
    if (boldMatch) {
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
