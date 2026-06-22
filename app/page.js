'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import FileUploadArea from '@/components/files/FileUploadArea';
import FileList from '@/components/files/FileList';
import MarkdownViewDialog from '@/components/files/MarkdownViewDialog';
import AdvancedChunkDialog from '@/components/chunking/AdvancedChunkDialog';

export default function HomePage() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFile, setViewFile] = useState(null);
  const [chunkFile, setChunkFile] = useState(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('加载文件列表失败');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Load files failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploadSuccess = () => {
    loadFiles();
  };

  const handleChunkSuccess = () => {
    loadFiles();
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* 上传区域 */}
        <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
          <Typography variant="h6" gutterBottom>
            {t('files.upload')}
          </Typography>
          <FileUploadArea onUploadSuccess={handleUploadSuccess} />
        </Paper>

        {/* 文件列表 */}
        <Paper sx={{ p: 2 }} elevation={1}>
          <Typography variant="h6" gutterBottom>
            {t('files.list')}
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FileList
              files={files}
              onViewFile={file => setViewFile(file)}
              onChunkFile={file => setChunkFile(file)}
              onRefresh={loadFiles}
            />
          )}
        </Paper>
      </Box>

      {/* 查看原文对话框 */}
      <MarkdownViewDialog
        open={!!viewFile}
        file={viewFile}
        onClose={() => setViewFile(null)}
      />

      {/* 高级分块对话框 */}
      {chunkFile && (
        <AdvancedChunkDialog
          open={!!chunkFile}
          file={chunkFile}
          onClose={() => setChunkFile(null)}
          onSaveSuccess={handleChunkSuccess}
        />
      )}
    </AppLayout>
  );
}
