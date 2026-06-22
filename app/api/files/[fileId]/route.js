import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CHUNKS_DIR = path.join(DATA_DIR, 'chunks');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

function readMetadata() {
  if (!fs.existsSync(METADATA_FILE)) return { files: [] };
  return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
}

function writeMetadata(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * GET /api/files/[fileId] - 获取文件内容
 */
export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const metadata = readMetadata();
    const fileInfo = metadata.files.find(f => f.id === fileId);

    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const filePath = path.join(UPLOADS_DIR, `${fileId}.md`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File content not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ success: true, fileId, fileName: fileInfo.fileName, content, size: content.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/files/[fileId] - 删除文件及分块
 */
export async function DELETE(request, { params }) {
  try {
    const { fileId } = params;

    // 删除上传文件
    const filePath = path.join(UPLOADS_DIR, `${fileId}.md`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // 删除分块数据
    const chunksPath = path.join(CHUNKS_DIR, `${fileId}.json`);
    if (fs.existsSync(chunksPath)) fs.unlinkSync(chunksPath);

    // 从元数据中移除
    const metadata = readMetadata();
    metadata.files = metadata.files.filter(f => f.id !== fileId);
    writeMetadata(metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
