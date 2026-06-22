# Markdown Advanced Chunker

一款高级 Markdown 文档分块工具，提供可视化三栏工作台，用于上传 Markdown文档、预览分块、编辑结果、保存并导出 JSON/JSONL 数据。内置原子块保护与 5 维度质量评分算法，适用于模型微调数据集制作的数据预处理、知识库构建、RAG 数据预处理等场景。

## 功能特性

- 高级 Markdown 分块：提供 `splitAdvancedMarkdown(markdownText, config)` 作为主入口。
- 原子块保护：保护代码块、Markdown 表格、HTML 表格、数学公式、列表等结构不被截断。
- 质量评分：按长度适配、标题上下文、句子完整性、原子完整性、内容多样性进行 5 维度评分。
- 可视化编辑：三栏工作台布局，左侧大纲树、中间分块预览、右侧参数和统计。
- 分块操作：支持展开、编辑、删除、向上/向下合并、点击位置拆分。
- 文件工作流：支持上传 `.md`、查看原文、下载原文、保存分块、重新加载已保存结果、导出 JSON/JSONL。
- 本地存储：使用 `data/metadata.json`、`data/uploads/`、`data/chunks/`，无需数据库。
- 国际化：内置简体中文和英文。

## 技术栈

- Next.js 14 App Router
- React 18
- Material UI 5
- react-markdown + github-markdown-css
- i18next + react-i18next
- 本地 JSON 文件存储

## 安装与运行

> 前置要求：Node.js 18.17 或更高版本。

```bash
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

生产构建：

```bash
npm run build
npm run start
```

## 使用流程

1. 在首页上传一个 `.md` 文件。
2. 点击文件行右侧的高级分块按钮。
3. 调整最小长度、最大长度、是否保留标题上下文。
4. 点击“预览分块”生成三栏预览。
5. 在中间列表中编辑、拆分、合并或删除分块。
6. 点击“保存分块”写入本地 JSON。
7. 保存后可导出 JSON 或 JSONL。

## 核心 API

### `splitAdvancedMarkdown(markdownText, config)`

引入方式：

```js
const { splitAdvancedMarkdown } = require('./lib/engine/advanced');
```

参数：

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `markdownText` | `string` | 必填 | 原始 Markdown 文本 |
| `config.minLength` | `number` | `800` | 推荐最小分块长度 |
| `config.maxLength` | `number` | `2000` | 推荐最大分块长度 |
| `config.preserveHeadings` | `boolean` | `true` | 拆分时是否保留标题上下文 |

返回值：

```js
{
  chunks: [
    {
      content: '# Title\n\n...',
      summary: '章节摘要',
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

示例：

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

| 路由 | 方法 | 说明 |
| --- | --- | --- |
| `/api/files` | `GET` | 获取已上传文件列表 |
| `/api/files` | `POST` | 上传 `.md` 文件，字段名为 `file` |
| `/api/files/[fileId]` | `GET` | 获取文件内容 |
| `/api/files/[fileId]` | `DELETE` | 删除文件及保存的分块 |
| `/api/files/[fileId]/download` | `GET` | 下载原始 Markdown 文件 |
| `/api/chunks/preview` | `POST` | 生成分块预览 |
| `/api/chunks/save` | `POST` | 保存分块结果 |
| `/api/chunks/[fileId]` | `GET` | 加载已保存分块 |
| `/api/chunks/export` | `POST` | 导出已保存分块 |

### 上传文件

```bash
curl -F "file=@example.md" http://localhost:3000/api/files
```

### 预览分块

```bash
curl -X POST http://localhost:3000/api/chunks/preview \
  -H "Content-Type: application/json" \
  -d "{\"fileId\":\"FILE_ID\",\"config\":{\"minLength\":800,\"maxLength\":2000,\"preserveHeadings\":true}}"
```

### 保存分块

```bash
curl -X POST http://localhost:3000/api/chunks/save \
  -H "Content-Type: application/json" \
  -d "{\"fileId\":\"FILE_ID\",\"fileName\":\"example.md\",\"config\":{\"minLength\":800,\"maxLength\":2000,\"preserveHeadings\":true},\"chunks\":[],\"stats\":{},\"outline\":[]}"
```

请求体：

```json
{
  "fileId": "FILE_ID",
  "fileName": "example.md",
  "config": {
    "minLength": 800,
    "maxLength": 2000,
    "preserveHeadings": true
  },
  "chunks": [],
  "stats": {},
  "outline": []
}
```

### 导出分块

```bash
curl -X POST http://localhost:3000/api/chunks/export \
  -H "Content-Type: application/json" \
  -d "{\"fileId\":\"FILE_ID\",\"format\":\"jsonl\"}"
```

`format` 支持：

- `json`
- `jsonl`

## 本地数据结构

运行时数据默认写入 `data/`：

```text
data/
├── metadata.json
├── uploads/
│   └── {fileId}.md
└── chunks/
    └── {fileId}.json
```

`data/metadata.json`：

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

`data/chunks/{fileId}.json`：

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

## 最佳实践

- 对普通知识库文档，建议 `minLength=800`、`maxLength=2000`。
- 对表格、代码和公式较多的科研文献文档，优先保持 `preserveHeadings=true`，即开启保留上下文按钮，便于分块保留上下文。
- 保存后再导出，确保导出的 JSON/JSONL 与本地持久化结果一致。
- 如果要批量处理文件，可直接调用 `splitAdvancedMarkdown`，绕过 UI 和 HTTP API。

## 项目结构

```text
app/                    Next.js 页面与 API 路由
components/chunking/    高级分块三栏 UI
components/files/       上传、列表、原文查看
components/layout/      顶部导航栏与语言切换
components/common/      通用确认对话框
lib/engine/advanced/    高级分块核心算法
lib/engine/core/        Markdown 大纲解析与摘要生成
lib/storage/            本地 JSON 存储辅助函数
lib/i18n.js             国际化配置
locales/                中英文翻译资源
data/                   运行时数据目录（自动创建）
```

## 许可证

AGPL-3.0
