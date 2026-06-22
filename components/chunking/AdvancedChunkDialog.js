'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PreviewIcon from '@mui/icons-material/Preview';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTranslation } from 'react-i18next';
import OutlineTreePanel from './OutlineTreePanel';
import ChunkPreviewList from './ChunkPreviewList';

/**
 * 高级 Markdown 分块对话框
 * 三栏布局：左侧大纲 | 中间分块预览 | 右侧参数+统计
 */
export default function AdvancedChunkDialog({ open, onClose, file, onSaveSuccess }) {
  const { t } = useTranslation();
  const fileId = file?.id;
  const fileName = file?.fileName;

  // 分块参数
  const [config, setConfig] = useState({
    minLength: 800,
    maxLength: 2000,
    preserveHeadings: true
  });

  // 预览状态
  const [chunks, setChunks] = useState([]);
  const [outline, setOutline] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeChunkIndex, setActiveChunkIndex] = useState(null);

  // UI 状态
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [hasSavedChunks, setHasSavedChunks] = useState(false);

  // 对话框打开时加载已保存的分块
  useEffect(() => {
    if (!open || !fileId) return;
    let cancelled = false;
    (async () => {
      setLoadingSaved(true);
      setHasSavedChunks(false);
      try {
        const res = await fetch(`/api/chunks/${fileId}`);
        const data = await res.json();
        if (!cancelled && data.chunks && data.chunks.length > 0) {
          setChunks(data.chunks);
          if (data.outline) setOutline(data.outline);
          if (data.stats) setStats(data.stats);
          if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
          setHasSavedChunks(true);
        }
      } catch (e) {
        // 加载失败不阻塞使用
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, fileId]);

  // 预览分块
  const handlePreview = useCallback(async () => {
    setPreviewing(true);
    setError('');
    try {
      const res = await fetch('/api/chunks/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, config })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');

      setChunks(data.chunks || []);
      setOutline(data.outline || []);
      setStats(data.stats || null);
      setActiveChunkIndex(null);
      setHasSavedChunks(false);
    } catch (err) {
      setError(err.message || t('textSplit.advancedSplitPreviewFailed'));
    } finally {
      setPreviewing(false);
    }
  }, [fileId, config, t]);

  // 保存分块（先确认）
  const handleSaveConfirm = () => {
    if (chunks.length === 0) return;
    setConfirmOpen(true);
  };

  const handleSave = useCallback(async () => {
    setConfirmOpen(false);
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/chunks/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, fileName, chunks, config, outline, stats })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setSuccessMsg(t('textSplit.advancedSplitSaveSuccess'));
      setHasSavedChunks(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setError(err.message || t('textSplit.advancedSplitSaveFailed'));
    } finally {
      setSaving(false);
    }
  }, [fileId, fileName, chunks, config, outline, stats, t, onSaveSuccess]);

  // 导出分块
  const handleExport = useCallback(async (format = 'json') => {
    try {
      const res = await fetch('/api/chunks/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, format })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || fileId}_chunks.${format === 'jsonl' ? 'jsonl' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg(t('textSplit.exportSuccess'));
    } catch (err) {
      setError(err.message);
    }
  }, [fileId, fileName, t]);

  // 大纲标题点击 → 跳转到包含该标题的分块
  const handleHeadingClick = useCallback((headingItem) => {
    const headingTitle = headingItem.title;
    const idx = chunks.findIndex(chunk =>
      chunk.headings && chunk.headings.includes(headingTitle)
    );
    if (idx >= 0) setActiveChunkIndex(idx);
  }, [chunks]);

  const handleClose = () => {
    setChunks([]);
    setOutline([]);
    setStats(null);
    setActiveChunkIndex(null);
    setHasSavedChunks(false);
    setError('');
    onClose();
  };

  // 分块交互修改回调（编辑/删除/合并/拆分后重新评分并更新统计）
  const handleChunksChange = useCallback((newChunks) => {
    const rescored = newChunks.map(c => {
      const newHeadings = c.headings || [];
      return {
        ...c,
        size: c.content.length,
        qualityScore: scoreChunkClient(c.content, newHeadings, config.minLength, config.maxLength),
        summary: regenerateSummary(c.content, newHeadings, c.headingPath)
      };
    });
    setChunks(rescored);
    setHasSavedChunks(false);

    // 重新计算统计信息
    if (rescored.length > 0) {
      const sizes = rescored.map(c => c.size);
      const scores = rescored.map(c => c.qualityScore);
      setStats(prev => ({
        ...prev,
        totalChunks: rescored.length,
        avgSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
        minSize: Math.min(...sizes),
        maxSize: Math.max(...sizes),
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        min: Math.min(...scores),
        max: Math.max(...scores)
      }));
    }
  }, [config.minLength, config.maxLength]);

  // 统计导航
  const navigateToChunk = useCallback((finder) => {
    if (!chunks || chunks.length === 0) return;
    const idx = finder(chunks);
    if (idx >= 0) setActiveChunkIndex(idx);
  }, [chunks]);

  const navToMinSize = useCallback(() => {
    navigateToChunk((cs) => {
      let minIdx = 0;
      cs.forEach((c, i) => { if ((c.size || c.content.length) < (cs[minIdx].size || cs[minIdx].content.length)) minIdx = i; });
      return minIdx;
    });
  }, [navigateToChunk]);

  const navToMaxSize = useCallback(() => {
    navigateToChunk((cs) => {
      let maxIdx = 0;
      cs.forEach((c, i) => { if ((c.size || c.content.length) > (cs[maxIdx].size || cs[maxIdx].content.length)) maxIdx = i; });
      return maxIdx;
    });
  }, [navigateToChunk]);

  const navToMinScore = useCallback(() => {
    navigateToChunk((cs) => {
      let minIdx = -1;
      cs.forEach((c, i) => {
        if (c.qualityScore != null && (minIdx === -1 || c.qualityScore < cs[minIdx].qualityScore)) minIdx = i;
      });
      return minIdx;
    });
  }, [navigateToChunk]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: { width: '92vw', maxWidth: 1400, height: '85vh', maxHeight: 900 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('textSplit.advancedSplitTitle')}
            {fileName && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                — {fileName}
              </Typography>
            )}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
          {/* 左栏：大纲树 */}
          <Box sx={{
            width: 240,
            minWidth: 200,
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'auto',
            flexShrink: 0
          }}>
            <OutlineTreePanel outline={outline} onHeadingClick={handleHeadingClick} />
          </Box>

          {/* 中栏：分块预览 */}
          <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
            {previewing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                <CircularProgress />
                <Typography color="text.secondary">{t('textSplit.advancedSplitPreviewing')}</Typography>
              </Box>
            ) : (
              <ChunkPreviewList
                chunks={chunks}
                activeChunkIndex={activeChunkIndex}
                onChunkClick={setActiveChunkIndex}
                onChunksChange={handleChunksChange}
              />
            )}
          </Box>

          {/* 右栏：参数 + 统计 */}
          <Box sx={{
            width: 280,
            minWidth: 250,
            borderLeft: 1,
            borderColor: 'divider',
            overflow: 'auto',
            flexShrink: 0,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {/* 参数区域 */}
            <Typography variant="subtitle2" fontWeight={600}>
              {t('textSplit.advancedSplitParams')}
            </Typography>

            <Box>
              <Typography variant="body2" gutterBottom>
                {t('settings.minLength')}: {config.minLength}
              </Typography>
              <Slider
                value={config.minLength}
                onChange={(_, v) => setConfig(prev => ({ ...prev, minLength: v }))}
                min={200}
                max={2500}
                step={100}
                size="small"
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                {t('settings.maxLength')}: {config.maxLength}
              </Typography>
              <Slider
                value={config.maxLength}
                onChange={(_, v) => setConfig(prev => ({ ...prev, maxLength: v }))}
                min={500}
                max={5000}
                step={100}
                size="small"
                valueLabelDisplay="auto"
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={config.preserveHeadings}
                  onChange={(e) => setConfig(prev => ({ ...prev, preserveHeadings: e.target.checked }))}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{t('settings.advancedPreserveHeadings')}</Typography>
              }
            />

            <Button
              variant="contained"
              startIcon={previewing ? <CircularProgress size={16} color="inherit" /> : <PreviewIcon />}
              onClick={handlePreview}
              disabled={previewing}
              fullWidth
            >
              {previewing ? t('textSplit.advancedSplitPreviewing') : t('textSplit.advancedSplitPreview')}
            </Button>

            <Divider />

            {/* 统计区域 */}
            {stats && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {t('textSplit.advancedSplitStats')}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <StatItem label={t('textSplit.advancedSplitTotalChunks')} value={stats.totalChunks} />
                  <StatItem label={t('textSplit.advancedSplitAvgScore')} value={stats.avg} />
                  <StatItem label={t('textSplit.advancedSplitAvgSize')} value={stats.avgSize} />
                  <StatItem label={t('textSplit.advancedSplitMinSize')} value={stats.minSize} onClick={navToMinSize} />
                  <StatItem label={t('textSplit.advancedSplitMaxSize')} value={stats.maxSize} onClick={navToMaxSize} />
                  <StatItem label={`${t('textSplit.advancedSplitQualityScore')} (min)`} value={stats.min} onClick={navToMinScore} />
                </Box>
              </Box>
            )}

            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleClose} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleExport('json')}
            disabled={!hasSavedChunks}
          >
            {t('textSplit.exportJson')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleExport('jsonl')}
            disabled={!hasSavedChunks}
          >
            {t('textSplit.exportJsonl')}
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveConfirm}
            disabled={saving || chunks.length === 0}
          >
            {saving ? t('textSplit.advancedSplitSaving') : t('textSplit.advancedSplitSave')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 确认对话框 */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('textSplit.advancedSplitConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('textSplit.advancedSplitConfirmMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功提示 */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>
      </Snackbar>
    </>
  );
}

/**
 * 统计项组件（可点击导航）
 */
function StatItem({ label, value, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        textAlign: 'center',
        p: 0.5,
        borderRadius: 1,
        bgcolor: 'action.hover',
        ...(onClick && {
          cursor: 'pointer',
          '&:hover': { bgcolor: 'primary.50', outline: '1px solid', outlineColor: 'primary.light' }
        })
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
  );
}

// ─── 客户端摘要重生成 ────────────────────────────────────────────────

function regenerateSummary(content, headings, headingPath) {
  if (headingPath && headingPath.length > 0) {
    return headingPath.join(' › ');
  }
  if (headings && headings.length > 0) {
    return headings.join(' > ');
  }
  const firstLine = (content || '').trim().split('\n')[0] || '';
  if (firstLine.startsWith('#')) {
    return firstLine.replace(/^#{1,6}\s+/, '');
  }
  if (firstLine.length > 60) return firstLine.substring(0, 60) + '...';
  return firstLine || '文本块';
}

// ─── 客户端质量评分（与 scoring.js 保持一致）─────────────────────────────────

function _scoreLengthAdequacy(len, minLength, maxLength) {
  if (len === 0) return 0;
  if (len >= minLength && len <= maxLength) {
    const segWidth = (maxLength - minLength) / 5;
    const segIndex = Math.min(4, Math.floor((len - minLength) / segWidth));
    switch (segIndex) {
      case 2: return 20;
      case 1: case 3: return 18;
      case 0: case 4: return 15;
      default: return 15;
    }
  }
  if (len < minLength) return (len / minLength) * 15;
  return (maxLength / len) * 15;
}

function _scoreHeadingPresence(content, headings) {
  if (/^\s*#{1,6}\s+/.test(content)) return 20;
  if (headings && headings.length > 0) return 15;
  if (/^\s*>\s*所属章节：/.test(content)) return 15;
  if (/^#{1,6}\s+/m.test(content)) return 12;
  return 0;
}

function _scoreSentenceCompleteness(content) {
  const trimmed = content.trim();
  if (!trimmed) return 0;
  let score = 12;
  const last = trimmed[trimmed.length - 1];
  if ('.!?。！？'.includes(last)) score += 5;
  if (trimmed.endsWith('```')) score += 5;
  const endsWithHtmlClose = /<\/[a-zA-Z][a-zA-Z0-9]*\s*>\s*$/.test(trimmed);
  if (endsWithHtmlClose) score += 5;
  const endsWithDisplayMath = /\$\$\s*$/.test(trimmed);
  if (endsWithDisplayMath) score += 5;
  const lastLine = trimmed.split('\n').pop().trim();
  const endsWithTableRow = /^\|.+\|$/.test(lastLine);
  if (endsWithTableRow) score += 5;
  if (/[.!?。！？）\)」』\]】]$/.test(trimmed) || endsWithHtmlClose || endsWithDisplayMath || endsWithTableRow) score += 5;
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  const englishConnectives = ['and', 'but', 'however', 'therefore', 'moreover', 'furthermore', 'thus'];
  const chineseConnectives = ['上述', '前述', '上列', '前者', '如下', '下列', '以下', '该', '此', '这些', '此项', '此法', '此外', '另外', '因而', '故', '进而', '继而', '其中', '后者', '见表', '参见', '详见', '见下文', '见下表'];
  if (englishConnectives.includes(firstWord) || chineseConnectives.some(w => trimmed.startsWith(w))) score -= 3;
  return Math.min(25, Math.max(0, score));
}

function _hasUnbalancedHtmlTable(content) {
  const openCount = (content.match(/<table\b[^>]*>/gi) || []).length;
  const closeCount = (content.match(/<\/table\s*>/gi) || []).length;
  return openCount !== closeCount;
}

function _scoreAtomicIntegrity(content) {
  let score = 20;
  const fenceMatches = content.match(/^(`{3,}|~{3,})/gm);
  if (fenceMatches && fenceMatches.length % 2 !== 0) score -= 10;
  const ddCount = (content.match(/\$\$/g) || []).length;
  if (ddCount % 2 !== 0) score -= 10;
  if (_hasUnbalancedHtmlTable(content)) score -= 10;
  const tableRows = content.match(/^\|.*\|$/gm);
  if (tableRows && tableRows.length > 0) {
    const hasSep = tableRows.some(r => /^\|[\s\-:|]+\|$/.test(r));
    if (!hasSep && tableRows.length > 1) score -= 5;
  }
  return Math.max(0, score);
}

function _scoreContentVariety(content) {
  let score = 5;
  if (/^\|.*\|$/m.test(content)) score += 2;
  if (/\$[^$]+\$/.test(content) || /\$\$[\s\S]+?\$\$/.test(content)) score += 2;
  if (/^\s*[-*+]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content)) score += 2;
  if (/^```/m.test(content)) score += 2;
  const plain = content
    .replace(/^\|.*\|$/gm, '').replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/```[\s\S]*?```/g, '').replace(/^\s*[-*+\d.]\s+.*/gm, '')
    .replace(/^#{1,6}\s+.*/gm, '').trim();
  if (plain.length > 100) score += 5;
  return Math.min(15, score);
}

function scoreChunkClient(content, headings, minLength = 800, maxLength = 2000) {
  const len = (content || '').trim().length;
  const total =
    _scoreLengthAdequacy(len, minLength, maxLength) +
    _scoreHeadingPresence(content, headings) +
    _scoreSentenceCompleteness(content) +
    _scoreAtomicIntegrity(content) +
    _scoreContentVariety(content);
  return Math.round(Math.min(100, Math.max(0, total)));
}
