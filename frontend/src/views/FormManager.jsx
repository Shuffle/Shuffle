import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  FileCopy as CopyIcon,
  Assessment as StatsIcon,
  Link as LinkIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';

import theme from '../theme.jsx';
import { Context } from '../context/ContextApi.jsx';

const FormManager = (props) => {
  const { globalUrl, userdata, isLoggedIn } = props;
  const { themeMode } = useContext(Context);
  const navigate = useNavigate();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${globalUrl}/api/v1/forms`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const formsData = await response.json();
        setForms(formsData);
      } else {
        toast.error('Failed to load forms');
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error('Error loading forms');
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId) => {
    try {
      const response = await fetch(`${globalUrl}/api/v1/forms/${formId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Form deleted successfully');
        loadForms();
      } else {
        toast.error('Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Error deleting form');
    }
    setDeleteDialogOpen(false);
    setSelectedForm(null);
  };

  const duplicateForm = async (form) => {
    try {
      const duplicatedForm = {
        ...form,
        id: undefined,
        name: `${form.name} (Copy)`,
        metadata: {
          ...form.metadata,
          created: null,
          updated: null,
          submissions: 0
        }
      };

      const response = await fetch(`${globalUrl}/api/v1/forms`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicatedForm),
      });

      if (response.ok) {
        toast.success('Form duplicated successfully');
        loadForms();
      } else {
        toast.error('Failed to duplicate form');
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Error duplicating form');
    }
  };

  const copyFormLink = (formId) => {
    const formUrl = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(formUrl);
    toast.success('Form link copied to clipboard');
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuClick = (event, form) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getFormStatusChip = (form) => {
    if (!form.settings.requireAuth && form.settings.allowAnonymous) {
      return <Chip icon={<PublicIcon />} label="Public" color="success" size="small" />;
    } else if (form.settings.requireAuth) {
      return <Chip icon={<LockIcon />} label="Private" color="warning" size="small" />;
    }
    return <Chip label="Internal" color="default" size="small" />;
  };

  return (
    <div style={{ padding: 20, backgroundColor: theme.palette.surfaceColor, minHeight: '100vh' }}>
      {/* Header */}
      <Paper style={{ padding: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              Form Manager
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create and manage your forms
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/forms/generator/new')}
            >
              Create New Form
            </Button>
          </Grid>
        </Grid>

        <TextField
          placeholder="Search forms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          style={{ marginTop: 15, backgroundColor: theme.palette.inputColor }}
          fullWidth
        />
      </Paper>

      {/* Forms Grid */}
      <Grid container spacing={3}>
        {filteredForms.map((form) => (
          <Grid item xs={12} sm={6} md={4} key={form.id}>
            <Card style={{ backgroundColor: theme.palette.inputColor, height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom={2}>
                  <Typography variant="h6" noWrap style={{ flex: 1, marginRight: 10 }}>
                    {form.name}
                  </Typography>
                  <IconButton size="small" onClick={(e) => handleMenuClick(e, form)}>
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="textSecondary" style={{ marginBottom: 10 }}>
                  {form.description || 'No description'}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
                  {getFormStatusChip(form)}
                  <Typography variant="caption" color="textSecondary">
                    {form.fields.length} fields
                  </Typography>
                </Box>

                <Typography variant="caption" color="textSecondary" display="block">
                  Created: {formatDate(form.metadata.created)}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  Submissions: {form.metadata.submissions || 0}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => window.open(`/forms/${form.id}`, '_blank')}
                >
                  View
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/forms/generator/${form.id}`)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => copyFormLink(form.id)}
                >
                  Copy Link
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredForms.length === 0 && !loading && (
        <Paper style={{ padding: 40, textAlign: 'center', backgroundColor: theme.palette.inputColor }}>
          <Typography variant="h6" gutterBottom>
            No forms found
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first form to get started'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/forms/generator/new')}
              style={{ marginTop: 20 }}
            >
              Create New Form
            </Button>
          )}
        </Paper>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/forms/generator/${selectedForm?.id}`); handleMenuClose(); }}>
          <EditIcon style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { duplicateForm(selectedForm); handleMenuClose(); }}>
          <CopyIcon style={{ marginRight: 8 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => { copyFormLink(selectedForm?.id); handleMenuClose(); }}>
          <LinkIcon style={{ marginRight: 8 }} />
          Copy Link
        </MenuItem>
        <MenuItem onClick={() => { setShareDialogOpen(true); handleMenuClose(); }}>
          <ShareIcon style={{ marginRight: 8 }} />
          Share
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <DeleteIcon style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedForm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => deleteForm(selectedForm?.id)} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Form</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Share this form with others using the link below:
          </Typography>
          <TextField
            fullWidth
            value={selectedForm ? `${window.location.origin}/forms/${selectedForm.id}` : ''}
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={() => copyFormLink(selectedForm?.id)}>
                  <CopyIcon />
                </IconButton>
              )
            }}
            style={{ marginTop: 10, backgroundColor: theme.palette.inputColor }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FormManager;
