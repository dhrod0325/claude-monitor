// Widget 공통 유틸리티

export interface WidgetResultContent {
  content?: string | { text?: string } | Array<{ text?: string } | string>;
  is_error?: boolean;
}

export function extractResultContent(result?: WidgetResultContent): string {
  if (!result) return '';

  if (typeof result.content === 'string') {
    return result.content;
  }

  if (result.content && typeof result.content === 'object') {
    if ('text' in result.content && result.content.text) {
      return result.content.text;
    }
    if (Array.isArray(result.content)) {
      return result.content
        .map((c) => (typeof c === 'string' ? c : c.text || JSON.stringify(c)))
        .join('\n');
    }
    return JSON.stringify(result.content, null, 2);
  }

  return '';
}

export function truncateContent(content: string, maxLength = 2000): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '\n...(truncated)';
}

export function countLines(content: string): number {
  return content.split('\n').filter((line) => line.trim()).length;
}
