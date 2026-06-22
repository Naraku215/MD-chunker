/**
 * 文件存储模块
 * 使用本地文件系统 + JSON 元数据索引
 */

const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readMetadata() {
  ensureDir(DATA_DIR);
  ensureDir(UPLOADS_DIR);
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify({ files: [] }, null, 2), 'utf-8');
  }
  const raw = fs.readFileSync(METADATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeMetadata(data) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 添加文件
 * @param {string} fileName - 原始文件名
 * @param {Buffer|string} content - 文件内容
 * @returns {{ id: string, fileName: string, size: number, uploadedAt: string }}
 */
function addFile(fileName, content) {
  ensureDir(UPLOADS_DIR);
  const id = nanoid(12);
  const filePath = path.join(UPLOADS_DIR, `${id}.md`);
  const contentStr = typeof content === 'string' ? content : content.toString('utf-8');
  fs.writeFileSync(filePath, contentStr, 'utf-8');

  const metadata = readMetadata();
  const fileInfo = {
    id,
    fileName,
    size: contentStr.length,
    uploadedAt: new Date().toISOString(),
    chunkedAt: null
  };
  metadata.files.push(fileInfo);
  writeMetadata(metadata);

  return fileInfo;
}

/**
 * 获取所有文件列表
 * @returns {Array}
 */
function getFiles() {
  const metadata = readMetadata();
  return metadata.files || [];
}

/**
 * 获取单个文件元信息
 * @param {string} fileId
 * @returns {Object|null}
 */
function getFileById(fileId) {
  const metadata = readMetadata();
  return metadata.files.find(f => f.id === fileId) || null;
}

/**
 * 读取文件内容
 * @param {string} fileId
 * @returns {string|null}
 */
function getFileContent(fileId) {
  const filePath = path.join(UPLOADS_DIR, `${fileId}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * 删除文件（同时删除分块数据）
 * @param {string} fileId
 * @returns {boolean}
 */
function deleteFile(fileId) {
  // 删除上传文件
  const filePath = path.join(UPLOADS_DIR, `${fileId}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // 删除对应的分块数据
  const chunksPath = path.join(DATA_DIR, 'chunks', `${fileId}.json`);
  if (fs.existsSync(chunksPath)) {
    fs.unlinkSync(chunksPath);
  }

  // 从元数据中移除
  const metadata = readMetadata();
  metadata.files = metadata.files.filter(f => f.id !== fileId);
  writeMetadata(metadata);

  return true;
}

/**
 * 更新文件分块时间
 * @param {string} fileId
 */
function markFileChunked(fileId) {
  const metadata = readMetadata();
  const file = metadata.files.find(f => f.id === fileId);
  if (file) {
    file.chunkedAt = new Date().toISOString();
    writeMetadata(metadata);
  }
}

module.exports = {
  addFile,
  getFiles,
  getFileById,
  getFileContent,
  deleteFile,
  markFileChunked
};
