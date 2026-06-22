import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readMetadata() {
  ensureDir(DATA_DIR);
  ensureDir(UPLOADS_DIR);
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify({ files: [] }, null, 2), 'utf-8');
  }
  return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
}

function writeMetadata(data) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * GET /api/files - 获取文件列表
 */
export async function GET() {
  try {
    const metadata = readMetadata();
    return NextResponse.json({ success: true, files: metadata.files, total: metadata.files.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/files - 上传文件
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    if (!fileName.endsWith('.md')) {
      return NextResponse.json({ error: 'Only .md files are supported' }, { status: 400 });
    }

    const content = await file.text();
    const { nanoid } = await import('nanoid');
    const id = nanoid(12);

    ensureDir(UPLOADS_DIR);
    const filePath = path.join(UPLOADS_DIR, `${id}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');

    const metadata = readMetadata();
    const fileInfo = {
      id,
      fileName,
      size: content.length,
      uploadedAt: new Date().toISOString(),
      chunkedAt: null
    };
    metadata.files.push(fileInfo);
    writeMetadata(metadata);

    return NextResponse.json({ success: true, ...fileInfo });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
