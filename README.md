# Markdown Advanced Chunker

A structure-aware Markdown document chunking tool designed for RAG pipelines and LLM fine-tuning dataset preparation. Unlike naive token splitters, it protects atomic elements (code blocks, math formulas, tables, lists) from being broken across chunk boundaries, merges short chunks by semantic affinity, and scores each chunk across 5 quality dimensions.

[中文文档](#中文说明)

---

## Features

- **Structure-aware chunking** — Parses heading hierarchy to build a document outline, then splits and merges sections intelligently rather than cutting at fixed character counts.
- **Atomic element protection** — Code fences, display/inline math (`$$...$$`, `$...$`), Markdown tables, HTML tables, and lists are detected and replaced with placeholders before splitting, then restored — ensuring they are never truncated.
- **5-dimension quality scoring** — Each chunk receives a 0–100 score based on length adequacy, heading presence, sentence completeness, atomic integrity, and content variety.
- **Semantic affinity merging** — Short chunks are merged with their most semantically related neighbor using heading-path similarity (common prefix matching, heading set intersection, sibling detection in the outline tree).
- **Context preservation** — When a section is split into multiple parts, subsequent parts automatically receive a `> Context: Chapter > Section > Subsection` blockquote prefix.
- **Visual 3-pane workspace** — Upload, preview, edit, save, and export chunks through an intuitive web UI with an outline tree panel, chunk list, and configurable parameters.
- **Dual-mode usage** — Works both as a standalone web application and as an importable Node.js library function.
- **Export formats** — JSON and JSONL.
- **i18n** — Full English and Simplified Chinese support with browser language auto-detection.
- **No database required** — All storage is file-system based.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Material UI 5
- react-markdown + github-markdown-css
- i18next + react-i18next
- Local JSON file storage

## Getting Started

> Prerequisite: Node.js 18.17 or higher.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

Production build:

```bash
npm run build
npm run start
```

## Usage

1. Upload a `.md` file on the home page.
2. Click the "Advanced Chunk" button on the file row.
3. Adjust minimum length, maximum length, and heading context preservation.
4. Click "Preview" to generate chunks.
5. Edit, split, merge, or delete chunks in the center panel.
6. Click "Save" to persist results locally.
7. Export as JSON or JSONL after saving.

## Core API

### `splitAdvancedMarkdown(markdownText, config)`

```js
const { splitAdvancedMarkdown } = require('./lib/engine/advanced');
```

Parameters:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `markdownText` | `string` | required | Raw Markdown text |
| `config.minLength` | `number` | `800` | Recommended minimum chunk length |
| `config.maxLength` | `number` | `2000` | Recommended maximum chunk length |
| `config.preserveHeadings` | `boolean` | `true` | Preserve heading context in sub-chunks |

Return value:

```js
{
  chunks: [
    {
      content: '# Title\n\n...',
      summary: 'Section summary',
      qualityScore: 92,
      size: 1234,
      headings: ['Title'],
      headingPath: ['Title'],
      partIndex: 1,
      totalParts: 2
    }
  ],
  stats: {
    totalChunks: 10,
    avg: 88,
    min: 73,
    max: 98,
    avgSize: 1410,
    minSize: 820,
    maxSize: 1994
  },
  outline: []
}
```

Example:

```js
const { splitAdvancedMarkdown } = require('./lib/engine/advanced');

const result = splitAdvancedMarkdown(markdown, {
  minLength: 800,
  maxLength: 2000,
  preserveHeadings: true
});

console.log(result.chunks);
```

## HTTP API

| Route | Method | Description |
| --- | --- | --- |
| `/api/files` | `GET` | List all uploaded files |
| `/api/files` | `POST` | Upload a `.md` file (field name: `file`) |
| `/api/files/[fileId]` | `GET` | Get file metadata |
| `/api/files/[fileId]` | `DELETE` | Delete file and its chunks |
| `/api/files/[fileId]/download` | `GET` | Download original Markdown file |
| `/api/chunks/preview` | `POST` | Generate chunk preview |
| `/api/chunks/save` | `POST` | Save chunking result |
| `/api/chunks/[fileId]` | `GET` | Load saved chunks |
| `/api/chunks/export` | `POST` | Export saved chunks |

### Upload a file

```bash
curl -F "file=@example.md" http://localhost:3000/api/files
```

### Preview chunks

```bash
curl -X POST http://localhost:3000/api/chunks/preview \
  -H "Content-Type: application/json" \
  -d '{"fileId":"FILE_ID","config":{"minLength":800,"maxLength":2000,"preserveHeadings":true}}'
```

### Save chunks

```bash
curl -X POST http://localhost:3000/api/chunks/save \
  -H "Content-Type: application/json" \
  -d '{"fileId":"FILE_ID","fileName":"example.md","config":{"minLength":800,"maxLength":2000,"preserveHeadings":true},"chunks":[],"stats":{},"outline":[]}'
```

### Export chunks

```bash
curl -X POST http://localhost:3000/api/chunks/export \
  -H "Content-Type: application/json" \
  -d '{"fileId":"FILE_ID","format":"jsonl"}'
```

Supported `format` values: `json`, `jsonl`.

## Data Storage

Runtime data is written to the `data/` directory:

```text
data/
├── metadata.json
├── uploads/
│   └── {fileId}.md
└── chunks/
    └── {fileId}.json
```

`data/metadata.json`:

```json
{
  "files": [
    {
      "id": "abc123",
      "fileName": "example.md",
      "size": 1234,
      "uploadedAt": "2026-06-18T00:00:00.000Z",
      "chunkedAt": null
    }
  ]
}
```

`data/chunks/{fileId}.json`:

```json
{
  "fileId": "abc123",
  "fileName": "example.md",
  "savedAt": "2026-06-18T00:00:00.000Z",
  "config": {},
  "chunks": [],
  "stats": {},
  "outline": []
}
```

## Best Practices

- For general knowledge base documents, use `minLength=800` and `maxLength=2000`.
- For scientific literature with many tables, code blocks, and formulas, keep `preserveHeadings=true` to retain context in each chunk.
- Save before exporting to ensure JSON/JSONL output matches persisted results.
- For batch processing, call `splitAdvancedMarkdown` directly to bypass the UI and HTTP API.

## Project Structure

```text
app/                    Next.js pages and API routes
components/chunking/    Advanced chunking 3-pane UI
components/files/       Upload, file list, original view
components/layout/      Navigation bar and language switch
components/common/      Shared confirmation dialogs
lib/engine/advanced/    Advanced chunking core algorithm
lib/engine/core/        Markdown outline parsing and summary generation
lib/storage/            Local JSON storage helpers
lib/i18n.js             Internationalization config
locales/                Chinese/English translation resources
data/                   Runtime data directory (auto-created)
```

## License

[AGPL-3.0](./LICENSE)

---

## 中文说明

一款高级 Markdown 文档分块工具，提供可视化三栏工作台，用于上传 Markdown 文档、预览分块、编辑结果、保存并导出 JSON/JSONL 数据。内置原子块保护与 5 维度质量评分算法，适用于模型微调数据集制作的数据预处理、知识库构建、RAG 数据预处理等场景。

### 功能特性

- 高级 Markdown 分块：提供 `splitAdvancedMarkdown(markdownText, config)` 作为主入口。
- 原子块保护：保护代码块、Markdown 表格、HTML 表格、数学公式、列表等结构不被截断。
- 质量评分：按长度适配、标题上下文、句子完整性、原子完整性、内容多样性进行 5 维度评分。
- 可视化编辑：三栏工作台布局，左侧大纲树、中间分块预览、右侧参数和统计。
- 分块操作：支持展开、编辑、删除、向上/向下合并、点击位置拆分。
- 文件工作流：支持上传 `.md`、查看原文、下载原文、保存分块、重新加载已保存结果、导出 JSON/JSONL。
- 本地存储：使用 `data/metadata.json`、`data/uploads/`、`data/chunks/`，无需数据库。
- 国际化：内置简体中文和英文。

### 安装与运行

> 前置要求：Node.js 18.17 或更高版本。

```bash
npm install
npm run dev
```

默认访问地址：`http://localhost:3000`

生产构建：

```bash
npm run build
npm run start
```

### 许可证

AGPL-3.0
