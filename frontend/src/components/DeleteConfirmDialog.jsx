import React, { memo, useContext } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { getTheme } from '../theme.jsx';
import { Context } from '../context/ContextApi.jsx';

const DeleteConfirmDialog = memo(({ open, onClose, onConfirm, title, description, warningText }) => {
  const { themeMode, brandColor } = useContext(Context);
  const theme = getTheme(themeMode, brandColor);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: theme?.palette?.DialogStyle?.borderRadius,
          border: theme?.palette?.DialogStyle?.border,
          fontFamily: theme?.typography?.fontFamily,
          backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
          minWidth: 420,
          '& .MuiDialogContent-root': { backgroundColor: theme?.palette?.DialogStyle?.backgroundColor },
          '& .MuiDialogTitle-root': { backgroundColor: theme?.palette?.DialogStyle?.backgroundColor },
          '& .MuiDialogActions-root': { backgroundColor: theme?.palette?.DialogStyle?.backgroundColor },
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{description}</Typography>
        {warningText && (
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
            {warningText}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button style={{ textTransform: 'none' }} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          style={{ textTransform: 'none', backgroundColor: theme?.palette?.deleteColor, color: '#fff' }}
          onClick={onConfirm}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default DeleteConfirmDialog;
