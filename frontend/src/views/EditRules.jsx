import React from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';

const EditComponent = ({ ruleName, description, content, setContent, lastEdited, editedBy, onSave }) => {

  const handleSave = () => {
    onSave(content);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, height: '100%', width: '100%', marginTop:'30px'}}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h6">{ruleName}</Typography>
      </Box>
      <Typography variant="body2" style={{ marginTop: '2%' }}>
          {description}
        </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Last edited: {lastEdited}
      </Typography>
      <Typography variant="body2">
        Edited By: {editedBy}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <TextField
          multiline
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          fullWidth
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default EditComponent;
