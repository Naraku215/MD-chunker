/**
 * 分块数据存储模块
 * 将分块结果持久化为 JSON 文件
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const CHUNKS_DIR = path.join(DATA_DIR, 'chunks');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 保存分块结果
 * @param {string} fileId
 * @param {Object} data - { fileName, config, chunks, stats, outline }
 */
function saveChunks(fileId, data) {
  ensureDir(CHUNKS_DIR);
  const filePath = path.join(CHUNKS_DIR, `${fileId}.json`);
  const record = {
    fileId,
    fileName: data.fileName,
    savedAt: new Date().toISOString(),
    config: data.config || {},
    chunks: data.chunks || [],
    stats: data.stats || {},
    outline: data.outline || []
  };
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
  return record;
}

/**
 * 获取已保存的分块数据
 * @param {string} fileId
 * @returns {Object|null}
 */
function getChunksByFileId(fileId) {
  ensureDir(CHUNKS_DIR);
  const filePath = path.join(CHUNKS_DIR, `${fileId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * 删除分块数据
 * @param {string} fileId
 */
function deleteChunksByFileId(fileId) {
  const filePath = path.join(CHUNKS_DIR, `${fileId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * 导出分块为指定格式
 * @param {string} fileId
 * @param {string} format - 'json' | 'jsonl'
 * @returns {string|null}
 */
function exportChunks(fileId, format = 'json') {
  const data = getChunksByFileId(fileId);
  if (!data) return null;

  if (format === 'jsonl') {
    return data.chunks.map((chunk, index) => JSON.stringify({
      index,
      content: chunk.content,
      summary: chunk.summary,
      qualityScore: chunk.qualityScore,
      size: chunk.size,
      headings: chunk.headings,
      headingPath: chunk.headingPath
    })).join('\n');
  }

  // JSON 格式
  return JSON.stringify({
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
}

module.exports = {
  saveChunks,
  getChunksByFileId,
  deleteChunksByFileId,
  exportChunks
};
