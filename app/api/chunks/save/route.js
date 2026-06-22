import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CHUNKS_DIR = path.join(DATA_DIR, 'chunks');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * POST /api/chunks/save - 保存分块结果
 */
export async function POST(request) {
  try {
    const { fileId, fileName, chunks, config, outline, stats } = await request.json();

    if (!fileId || !chunks || !Array.isArray(chunks)) {
      return NextResponse.json({ error: 'Missing required: fileId, chunks' }, { status: 400 });
    }

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Chunks array is empty' }, { status: 400 });
    }

    ensureDir(CHUNKS_DIR);
    const filePath = path.join(CHUNKS_DIR, `${fileId}.json`);
    const record = {
      fileId,
      fileName: fileName || `${fileId}.md`,
      savedAt: new Date().toISOString(),
      config: config || {},
      chunks,
      stats: stats || computeStats(chunks),
      outline: outline || []
    };
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');

    // 更新文件 chunkedAt
    if (fs.existsSync(METADATA_FILE)) {
      const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      const file = metadata.files.find(f => f.id === fileId);
      if (file) {
        file.chunkedAt = new Date().toISOString();
        fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
      }
    }

    return NextResponse.json({ success: true, totalChunks: chunks.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function computeStats(chunks) {
  const scores = chunks.map(c => c.qualityScore || 0);
  const sizes = chunks.map(c => c.size || (c.content || '').length);
  return {
    totalChunks: chunks.length,
    avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    min: Math.min(...scores),
    max: Math.max(...scores),
    avgSize: Math.round(sizes.reduce((s, v) => s + v, 0) / sizes.length),
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes)
  };
}
