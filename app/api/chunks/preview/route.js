import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/chunks/preview - 分块预览
 */
export async function POST(request) {
  try {
    const { fileId, config = {} } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    // 读取文件内容
    const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
    const filePath = path.join(UPLOADS_DIR, `${fileId}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 调用分块引擎
    const { splitAdvancedMarkdown } = require('@/lib/engine/advanced/index');

    const advancedConfig = {
      minLength: config.minLength || 800,
      maxLength: config.maxLength || 2000,
      preserveHeadings: config.preserveHeadings !== false
    };

    const { chunks, stats, outline } = splitAdvancedMarkdown(fileContent, advancedConfig);

    return NextResponse.json({
      success: true,
      fileId,
      chunks,
      stats,
      outline,
      config: advancedConfig
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate preview' }, { status: 500 });
  }
}
