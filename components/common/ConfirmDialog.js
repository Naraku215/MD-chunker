'use client';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * 通用确认对话框组件
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmText,
  cancelText,
  confirmColor = 'error'
}) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onClose();
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      {content && (
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">{content}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {cancelText || t('common.cancel')}
        </Button>
        <Button onClick={handleConfirm} color={confirmColor} variant="contained" autoFocus>
          {confirmText || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
