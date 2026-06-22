import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
const METADATA_FILE = path.join(process.cwd(), 'data', 'metadata.json');

/**
 * GET /api/files/[fileId]/download - 下载原始文件
 */
export async function GET(request, { params }) {
  try {
    const { fileId } = params;

    // 获取文件名
    let fileName = `${fileId}.md`;
    if (fs.existsSync(METADATA_FILE)) {
      const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      const fileInfo = metadata.files.find(f => f.id === fileId);
      if (fileInfo) fileName = fileInfo.fileName;
    }

    const filePath = path.join(UPLOADS_DIR, `${fileId}.md`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
