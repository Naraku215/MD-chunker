'use client';

import { useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export default function FileUploadArea({ onUploadSuccess }) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileSelect = e => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
    // 重置 input 以允许再次选择相同文件
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async files => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/files', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '上传失败');
        }
      }
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        border: theme => `2px dashed ${dragActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3)}`,
        borderRadius: 2,
        bgcolor: theme => dragActive ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.02),
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
          borderColor: theme => alpha(theme.palette.primary.main, 0.5)
        },
        cursor: uploading ? 'not-allowed' : 'pointer',
        minHeight: 160
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {uploading ? (
        <CircularProgress size={32} />
      ) : (
        <>
          <UploadFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="subtitle1" gutterBottom>
            {t('files.dragOrClick')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('files.supportedFormats')}
          </Typography>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".md"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
      />
    </Box>
  );
}
