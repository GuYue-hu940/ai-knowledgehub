import { readFileSync } from 'fs';

export function extractText(storagePath: string, fileType: string): string {
  const type = fileType.toLowerCase();

  if (type === 'txt' || type === 'md') {
    return readFileSync(storagePath, 'utf-8');
  }

  throw new Error(`暂不支持解析：${fileType}`);
}

export function splitIntoChunks(
  text: string,
  size = 500,
  overlap = 100,
): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + size, cleaned.length);
    const slice = cleaned.slice(start, end).trim();
    if (slice) chunks.push(slice);

    if (end >= cleaned.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}
