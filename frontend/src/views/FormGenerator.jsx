import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Checkbox, 
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Box,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  TextFields as TextFieldsIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioIcon,
  ArrowDropDown as SelectIcon,
  DateRange as DateIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Link as UrlIcon,
  Numbers as NumberIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Share as ShareIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import theme from '../theme.jsx';
import { Context } from '../context/ContextApi.jsx';

const FormGenerator = (props) => {
  const { globalUrl, userdata, isLoggedIn } = props;
  const { themeMode } = useContext(Context);
  const navigate = useNavigate();
  const { formId } = useParams();

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: 'New Form',
    description: '',
    fields: [],
    settings: {
      requireAuth: false,
      allowAnonymous: true,
      submitButtonText: 'Submit',
      successMessage: 'Form submitted successfully!',
      redirectUrl: '',
      maxSubmissions: 0,
      enableCaptcha: false,
      formWidth: 600,
      theme: 'default'
    },
    workflow: {
      id: '',
      triggerOnSubmit: true,
      passFormData: true
    },
    metadata: {
      created: null,
      updated: null,
      createdBy: '',
      submissions: 0
    }
  });

  // UI state
  const [selectedField, setSelectedField] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Field types configuration
  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: <TextFieldsIcon />, description: 'Single line text input' },
    { type: 'textarea', label: 'Text Area', icon: <TextFieldsIcon />, description: 'Multi-line text input' },
    { type: 'email', label: 'Email', icon: <EmailIcon />, description: 'Email address input' },
    { type: 'phone', label: 'Phone', icon: <PhoneIcon />, description: 'Phone number input' },
    { type: 'number', label: 'Number', icon: <NumberIcon />, description: 'Numeric input' },
    { type: 'url', label: 'URL', icon: <UrlIcon />, description: 'Website URL input' },
    { type: 'date', label: 'Date', icon: <DateIcon />, description: 'Date picker' },
    { type: 'select', label: 'Dropdown', icon: <SelectIcon />, description: 'Single selection dropdown' },
    { type: 'multiselect', label: 'Multi-Select', icon: <SelectIcon />, description: 'Multiple selection dropdown' },
    { type: 'radio', label: 'Radio Buttons', icon: <RadioIcon />, description: 'Single choice from options' },
    { type: 'checkbox', label: 'Checkboxes', icon: <CheckBoxIcon />, description: 'Multiple choice options' },
    { type: 'file', label: 'File Upload', icon: <AddIcon />, description: 'File upload field' }
  ];

  useEffect(() => {
    if (formId && formId !== 'new') {
      loadForm(formId);
    }
    loadWorkflows();
  }, [formId]);

  const loadForm = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${globalUrl}/api/v1/forms/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const form = await response.json();
        setFormData(form);
      } else {
        toast.error('Failed to load form');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Error loading form');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`${globalUrl}/api/v1/workflows`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const workflows = await response.json();
        setAvailableWorkflows(workflows);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const saveForm = async () => {
    setLoading(true);
    setSaveStatus('Saving...');
    
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `${globalUrl}/api/v1/forms/${formData.id}` 
        : `${globalUrl}/api/v1/forms`;

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedForm = await response.json();
        setFormData(savedForm);
        setSaveStatus('Saved');
        toast.success('Form saved successfully');
        
        if (!formData.id) {
          navigate(`/forms/generator/${savedForm.id}`);
        }
      } else {
        throw new Error('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
      setSaveStatus('Error');
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const addField = (fieldType) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: fieldType.type,
      label: fieldType.label,
      name: `field_${formData.fields.length + 1}`,
      required: false,
      placeholder: '',
      helpText: '',
      validation: {},
      options: fieldType.type === 'select' || fieldType.type === 'radio' || fieldType.type === 'checkbox' 
        ? ['Option 1', 'Option 2'] 
        : [],
      defaultValue: '',
      visible: true,
      order: formData.fields.length
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    setSelectedField(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFormData(prev => ({
      ...prev,
      fields: updatedItems
    }));
  };

  return (
    <div style={{ padding: 20, backgroundColor: theme.palette.surfaceColor, minHeight: '100vh' }}>
      {/* Header */}
      <Paper style={{ padding: 20, marginBottom: 20, backgroundColor: theme.palette.inputColor }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              variant="outlined"
              placeholder="Form Name"
              style={{ backgroundColor: theme.palette.inputColor }}
              InputProps={{
                style: { fontSize: '1.5rem', fontWeight: 'bold' }
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
              style={{ marginRight: 10 }}
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={previewMode ? <EditIcon /> : <PreviewIcon />}
              onClick={() => setPreviewMode(!previewMode)}
              style={{ marginRight: 10 }}
            >
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveForm}
              disabled={loading}
            >
              {saveStatus || 'Save'}
            </Button>
          </Grid>
        </Grid>
        
        <TextField
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          variant="outlined"
          placeholder="Form description..."
          multiline
          rows={2}
          fullWidth
          style={{ marginTop: 10, backgroundColor: theme.palette.inputColor }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Field Types Panel */}
        {!previewMode && (
          <Grid item xs={12} md={3}>
            <Paper style={{ padding: 15, backgroundColor: theme.palette.inputColor }}>
              <Typography variant="h6" gutterBottom>
                Field Types
              </Typography>
              <List>
                {fieldTypes.map((fieldType) => (
                  <ListItem
                    key={fieldType.type}
                    button
                    onClick={() => addField(fieldType)}
                    style={{
                      marginBottom: 5,
                      borderRadius: 8,
                      backgroundColor: theme.palette.surfaceColor
                    }}
                  >
                    <ListItemIcon>
                      {fieldType.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={fieldType.label}
                      secondary={fieldType.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Form Builder / Preview */}
        <Grid item xs={12} md={previewMode ? 12 : 6}>
          <Paper style={{ 
            padding: 20, 
            backgroundColor: theme.palette.inputColor,
            minHeight: 400
          }}>
            <Typography variant="h6" gutterBottom>
              {previewMode ? 'Form Preview' : 'Form Builder'}
            </Typography>
            
            {formData.fields.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                style={{ height: 300, color: theme.palette.text.secondary }}
              >
                <Typography variant="h6" gutterBottom>
                  No fields added yet
                </Typography>
                <Typography variant="body2">
                  Add fields from the panel on the left to start building your form
                </Typography>
              </Box>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="form-fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {formData.fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: 15,
                                opacity: snapshot.isDragging ? 0.8 : 1
                              }}
                            >
                              <FormFieldRenderer
                                field={field}
                                previewMode={previewMode}
                                onSelect={() => setSelectedField(field)}
                                onUpdate={(updates) => updateField(field.id, updates)}
                                onDelete={() => deleteField(field.id)}
                                dragHandleProps={provided.dragHandleProps}
                                isSelected={selectedField?.id === field.id}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </Paper>
        </Grid>

        {/* Field Properties Panel */}
        {!previewMode && (
          <Grid item xs={12} md={3}>
            <Paper style={{ padding: 15, backgroundColor: theme.palette.inputColor }}>
              <Typography variant="h6" gutterBottom>
                Field Properties
              </Typography>
              
              {selectedField ? (
                <FieldPropertiesPanel
                  field={selectedField}
                  onUpdate={(updates) => updateField(selectedField.id, updates)}
                />
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Select a field to edit its properties
                </Typography>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

// FormFieldRenderer component for rendering individual form fields
const FormFieldRenderer = ({ field, previewMode, onSelect, onUpdate, onDelete, dragHandleProps, isSelected }) => {
  const renderFieldInput = () => {
    const commonProps = {
      fullWidth: true,
      variant: "outlined",
      placeholder: field.placeholder,
      required: field.required,
      disabled: previewMode,
      style: { backgroundColor: theme.palette.inputColor }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return <TextField {...commonProps} type={field.type} />;

      case 'number':
        return <TextField {...commonProps} type="number" />;

      case 'textarea':
        return <TextField {...commonProps} multiline rows={3} />;

      case 'date':
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;

      case 'select':
        return (
          <FormControl fullWidth variant="outlined">
            <InputLabel>{field.label}</InputLabel>
            <Select label={field.label} disabled={previewMode}>
              {field.options.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'radio':
        return (
          <div>
            {field.options.map((option, index) => (
              <FormControlLabel
                key={index}
                control={<input type="radio" name={field.name} disabled={previewMode} />}
                label={option}
              />
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            {field.options.map((option, index) => (
              <FormControlLabel
                key={index}
                control={<Checkbox disabled={previewMode} />}
                label={option}
              />
            ))}
          </div>
        );

      case 'file':
        return (
          <Button
            variant="outlined"
            component="label"
            disabled={previewMode}
            style={{ width: '100%', padding: 20 }}
          >
            Choose File
            <input type="file" hidden />
          </Button>
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Card
      style={{
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
        backgroundColor: theme.palette.surfaceColor,
        cursor: previewMode ? 'default' : 'pointer'
      }}
      onClick={!previewMode ? onSelect : undefined}
    >
      <CardContent>
        <Box display="flex" alignItems="center" marginBottom={1}>
          {!previewMode && (
            <IconButton {...dragHandleProps} size="small" style={{ marginRight: 8 }}>
              <DragIcon />
            </IconButton>
          )}

          <Typography variant="subtitle1" style={{ flex: 1 }}>
            {field.label}
            {field.required && <span style={{ color: 'red' }}> *</span>}
          </Typography>

          {!previewMode && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        {field.helpText && (
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: 10 }}>
            {field.helpText}
          </Typography>
        )}

        {renderFieldInput()}
      </CardContent>
    </Card>
  );
};

// FieldPropertiesPanel component for editing field properties
const FieldPropertiesPanel = ({ field, onUpdate }) => {
  const [localField, setLocalField] = useState(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleUpdate = (property, value) => {
    const updatedField = { ...localField, [property]: value };
    setLocalField(updatedField);
    onUpdate({ [property]: value });
  };

  const handleOptionUpdate = (index, value) => {
    const newOptions = [...localField.options];
    newOptions[index] = value;
    handleUpdate('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...localField.options, `Option ${localField.options.length + 1}`];
    handleUpdate('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = localField.options.filter((_, i) => i !== index);
    handleUpdate('options', newOptions);
  };

  return (
    <div>
      <TextField
        label="Field Label"
        value={localField.label}
        onChange={(e) => handleUpdate('label', e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
        style={{ backgroundColor: theme.palette.inputColor }}
      />

      <TextField
        label="Field Name"
        value={localField.name}
        onChange={(e) => handleUpdate('name', e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
        style={{ backgroundColor: theme.palette.inputColor }}
      />

      <TextField
        label="Placeholder"
        value={localField.placeholder}
        onChange={(e) => handleUpdate('placeholder', e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
        style={{ backgroundColor: theme.palette.inputColor }}
      />

      <TextField
        label="Help Text"
        value={localField.helpText}
        onChange={(e) => handleUpdate('helpText', e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
        multiline
        rows={2}
        style={{ backgroundColor: theme.palette.inputColor }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={localField.required}
            onChange={(e) => handleUpdate('required', e.target.checked)}
          />
        }
        label="Required Field"
        style={{ marginTop: 10, marginBottom: 10 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={localField.visible}
            onChange={(e) => handleUpdate('visible', e.target.checked)}
          />
        }
        label="Visible"
        style={{ marginBottom: 10 }}
      />

      {/* Options for select, radio, checkbox fields */}
      {(['select', 'multiselect', 'radio', 'checkbox'].includes(localField.type)) && (
        <div style={{ marginTop: 20 }}>
          <Typography variant="subtitle2" gutterBottom>
            Options
          </Typography>
          {localField.options.map((option, index) => (
            <Box key={index} display="flex" alignItems="center" marginBottom={1}>
              <TextField
                value={option}
                onChange={(e) => handleOptionUpdate(index, e.target.value)}
                variant="outlined"
                size="small"
                style={{ flex: 1, marginRight: 8, backgroundColor: theme.palette.inputColor }}
              />
              <IconButton size="small" onClick={() => removeOption(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={addOption}
            variant="outlined"
            size="small"
            style={{ marginTop: 5 }}
          >
            Add Option
          </Button>
        </div>
      )}
    </div>
  );
};

export default FormGenerator;
