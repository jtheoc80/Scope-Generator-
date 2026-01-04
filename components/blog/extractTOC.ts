// Helper to extract TOC from content - can be used in server components

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

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
