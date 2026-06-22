import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHUNKS_DIR = path.join(process.cwd(), 'data', 'chunks');

/**
 * POST /api/chunks/export - 导出分块结果
 */
export async function POST(request) {
  try {
    const { fileId, format = 'json' } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const filePath = path.join(CHUNKS_DIR, `${fileId}.json`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'No saved chunks found' }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    let exportContent;
    let contentType;
    let fileExt;

    if (format === 'jsonl') {
      exportContent = data.chunks.map((chunk, index) => JSON.stringify({
        index,
        content: chunk.content,
        summary: chunk.summary,
        qualityScore: chunk.qualityScore,
        size: chunk.size,
        headings: chunk.headings,
        headingPath: chunk.headingPath
      })).join('\n');
      contentType = 'application/x-ndjson';
      fileExt = 'jsonl';
    } else {
      exportContent = JSON.stringify({
        fileName: data.fileName,
        savedAt: data.savedAt,
        config: data.config,
        totalChunks: data.chunks.length,
        stats: data.stats,
        chunks: data.chunks.map((chunk, index) => ({
          index,
          content: chunk.content,
          summary: chunk.summary,
          qualityScore: chunk.qualityScore,
          size: chunk.size,
          headings: chunk.headings,
          headingPath: chunk.headingPath
        }))
      }, null, 2);
      contentType = 'application/json';
      fileExt = 'json';
    }

    const exportFileName = `${data.fileName || fileId}_chunks.${fileExt}`;

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(exportFileName)}"`,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
