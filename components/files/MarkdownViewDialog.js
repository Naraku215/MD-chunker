'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import 'github-markdown-css/github-markdown-light.css';

export default function MarkdownViewDialog({ open, file, onClose }) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && file) {
      loadContent();
    } else {
      setContent('');
    }
  }, [open, file]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setContent(data.content || '');
    } catch (err) {
      console.error('Load content failed:', err);
      setContent(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {file?.fileName || t('files.view')}
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 400, maxHeight: '70vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : content ? (
          <Box
            className="markdown-body"
            sx={{
              p: 2,
              '& img': { maxWidth: '100%' },
              '& table': { borderCollapse: 'collapse', width: '100%' },
              '& th, & td': { border: '1px solid #ddd', p: 1 }
            }}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
          </Box>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
            {t('files.noContent')}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
