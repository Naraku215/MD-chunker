'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FilePresent as FileIcon
} from '@mui/icons-material';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function FileList({
  files = [],
  onViewFile,
  onChunkFile,
  onDeleteFile,
  onRefresh
}) {
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, file: null });

  const handleDelete = async () => {
    if (!deleteConfirm.file) return;
    try {
      const res = await fetch(`/api/files/${deleteConfirm.file.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.message);
    }
    setDeleteConfirm({ open: false, file: null });
  };

  const handleDownload = (fileId, fileName) => {
    const a = document.createElement('a');
    a.href = `/api/files/${fileId}/download`;
    a.download = fileName;
    a.click();
  };

  const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = dateStr => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (files.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <FileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {t('files.empty')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ width: '100%' }}>
        {files.map((file, index) => (
          <Box key={file.id}>
            <ListItem
              sx={{ py: 1.5 }}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={t('files.view')}>
                    <IconButton size="small" onClick={() => onViewFile && onViewFile(file)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('files.download')}>
                    <IconButton size="small" onClick={() => handleDownload(file.id, file.fileName)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('files.advancedChunk')}>
                    <IconButton size="small" color="primary" onClick={() => onChunkFile && onChunkFile(file)}>
                      <TuneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirm({ open: true, file })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon fontSize="small" color="action" />
                    <Typography variant="body1" noWrap sx={{ maxWidth: 240 }}>
                      {file.fileName}
                    </Typography>
                    {file.chunkedAt && (
                      <Chip label={t('files.chunked')} size="small" color="success" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={`${formatSize(file.size)} · ${formatDate(file.uploadedAt)}`}
              />
            </ListItem>
            {index < files.length - 1 && <Divider />}
          </Box>
        ))}
      </List>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, file: null })}
        onConfirm={handleDelete}
        title={`${t('common.confirmDelete')}「${deleteConfirm.file?.fileName || ''}」?`}
        content={t('files.deleteWarning')}
      />
    </>
  );
}
