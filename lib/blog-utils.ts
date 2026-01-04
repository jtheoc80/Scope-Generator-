// Blog utility functions that can be used in both server and client components

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts table of contents items from blog content
 * @param content Array of content blocks (markdown strings)
 * @returns Array of TOC items with id, text, and level
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
