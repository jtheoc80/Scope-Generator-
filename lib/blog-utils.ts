/**
 * Blog utility functions for server-side use
 */

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract table of contents from blog content
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
