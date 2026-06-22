import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHUNKS_DIR = path.join(process.cwd(), 'data', 'chunks');

/**
 * GET /api/chunks/[fileId] - 加载已保存分块
 */
export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const filePath = path.join(CHUNKS_DIR, `${fileId}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: true, chunks: [] });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return NextResponse.json({
      success: true,
      chunks: data.chunks || [],
      savedAt: data.savedAt || null,
      config: data.config || {},
      stats: data.stats || null,
      outline: data.outline || []
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
