// Utility functions for blog content processing
// These are server-side utilities that don't require 'use client'

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract table of contents items from blog content array
 * Processes headings (## and ###) into TOC structure
 */
export function extractTOC(content: string[]): TOCItem[] {
  return content
    .filter(block => block.startsWith('## ') || block.startsWith('### '))
    .map(heading => {
      const level = heading.startsWith('### ') ? 3 : 2;
      const text = heading.replace(/^#{2,3}\s/, '');
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return { id, text, level };
    });
}
