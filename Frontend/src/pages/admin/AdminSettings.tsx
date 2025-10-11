import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  TextField, 
  Button, 
  Switch, 
  FormControlLabel, 
  Alert, 
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,


} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Types
interface AdminSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  dataType: string;
  category: number;
  description?: string;
  isActive: boolean;
  isEncrypted: boolean;
  isSensitive: boolean;
  defaultValue?: string;
  validationRules?: string;
  modifiedByUserId?: string;
  modifiedByUserName?: string;
  createdAt: string;
  lastModifiedAt?: string;
}

interface SettingsGroup {
  category: number;
  categoryName: string;
  categoryDescription: string;
  settings: AdminSetting[];
}

interface OperationResult {
  success: boolean;
  message: string;
  errors?: string[];
  setting?: AdminSetting;
}

const AdminSettingsPage: React.FC = () => {
  const [settingsGroups, setSettingsGroups] = useState<SettingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState<{[key: string]: string}>({});
  const [showSensitive, setShowSensitive] = useState<{[key: string]: boolean}>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({
    settingKey: '',
    settingValue: '',
    dataType: 'string',
    category: 0,
    description: '',
    isActive: true,
    isEncrypted: false,
    isSensitive: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSettingsGroups(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load admin settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, newValue: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_BASE_URL}/admin/${encodeURIComponent(settingKey)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settingKey,
          settingValue: newValue,
          notes: `Updated via Admin Settings GUI at ${new Date().toISOString()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OperationResult = await response.json();
      
      if (result.success) {
        setSuccess(`Setting '${settingKey}' updated successfully!`);
        // Clear the editing state for this setting
        setEditingSettings(prev => {
          const updated = { ...prev };
          delete updated[settingKey];
          return updated;
        });
        // Reload settings to get fresh data
        await loadSettings();
      } else {
        setError(result.message || 'Failed to update setting');
      }
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const createSetting = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newSetting,
          notes: `Created via Admin Settings GUI at ${new Date().toISOString()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OperationResult = await response.json();
      
      if (result.success) {
        setSuccess(`Setting '${newSetting.settingKey}' created successfully!`);
        setCreateDialogOpen(false);
        // Reset form
        setNewSetting({
          settingKey: '',
          settingValue: '',
          dataType: 'string',
          category: 0,
          description: '',
          isActive: true,
          isEncrypted: false,
          isSensitive: false
        });
        // Reload settings
        await loadSettings();
      } else {
        setError(result.message || 'Failed to create setting');
      }
    } catch (err) {
      console.error('Error creating setting:', err);
      setError('Failed to create setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (setting: AdminSetting) => {
    setEditingSettings(prev => ({
      ...prev,
      [setting.settingKey]: setting.settingValue
    }));
  };

  const handleCancelEdit = (settingKey: string) => {
    setEditingSettings(prev => {
      const updated = { ...prev };
      delete updated[settingKey];
      return updated;
    });
  };

  const handleSaveEdit = async (settingKey: string) => {
    const newValue = editingSettings[settingKey];
    if (newValue !== undefined) {
      await updateSetting(settingKey, newValue);
    }
  };

  const toggleSensitiveVisibility = (settingKey: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  const formatValue = (setting: AdminSetting): string => {
    if (setting.isSensitive && !showSensitive[setting.settingKey]) {
      return '***MASKED***';
    }
    return setting.settingValue;
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'string': return 'primary';
      case 'int': case 'integer': return 'secondary';
      case 'bool': case 'boolean': return 'success';
      case 'decimal': case 'double': case 'float': return 'warning';
      case 'json': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Typography>Loading admin settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure system-wide settings that override appsettings.json values
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSettings}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Setting
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <Accordion key={group.category} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">{group.categoryName}</Typography>
              <Chip 
                label={`${group.settings.length} settings`} 
                size="small" 
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {group.categoryDescription}
            </Typography>
            
            {group.settings.map((setting) => (
              <Card key={setting.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {setting.settingKey}
                        {setting.isSensitive && <SecurityIcon fontSize="small" color="warning" />}
                        {!setting.isActive && <Chip label="Inactive" size="small" color="error" />}
                        <Chip 
                          label={setting.dataType} 
                          size="small" 
                          color={getDataTypeColor(setting.dataType) as any}
                          variant="outlined"
                        />
                      </Typography>
                      {setting.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {setting.description}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {setting.isSensitive && (
                        <Tooltip title={showSensitive[setting.settingKey] ? "Hide value" : "Show value"}>
                          <IconButton 
                            size="small"
                            onClick={() => toggleSensitiveVisibility(setting.settingKey)}
                          >
                            {showSensitive[setting.settingKey] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {editingSettings[setting.settingKey] === undefined ? (
                        <Tooltip title="Edit setting">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditClick(setting)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <>
                          <Button 
                            size="small"
                            onClick={() => handleCancelEdit(setting.settingKey)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="small"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => handleSaveEdit(setting.settingKey)}
                            disabled={saving}
                          >
                            Save
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>

                  {editingSettings[setting.settingKey] !== undefined ? (
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={editingSettings[setting.settingKey]}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        [setting.settingKey]: e.target.value
                      }))}
                      type={setting.dataType === 'bool' || setting.dataType === 'boolean' ? 'text' : 
                            setting.dataType === 'int' || setting.dataType === 'integer' ? 'number' :
                            setting.isSensitive ? 'password' : 'text'}
                      placeholder={`Enter ${setting.dataType} value`}
                      helperText={setting.defaultValue ? `Default: ${setting.defaultValue}` : undefined}
                    />
                  ) : (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        backgroundColor: 'grey.100', 
                        padding: 1, 
                        borderRadius: 1,
                        wordBreak: 'break-all'
                      }}
                    >
                      {formatValue(setting)}
                    </Typography>
                  )}

                  {(setting.modifiedByUserName || setting.lastModifiedAt) && (
                    <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'grey.200' }}>
                      <Typography variant="caption" color="text.secondary">
                        {setting.lastModifiedAt && `Last modified: ${new Date(setting.lastModifiedAt).toLocaleString()}`}
                        {setting.modifiedByUserName && ` by ${setting.modifiedByUserName}`}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Create Setting Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Setting</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Setting Key"
              value={newSetting.settingKey}
              onChange={(e) => setNewSetting(prev => ({ ...prev, settingKey: e.target.value }))}
              placeholder="e.g., JwtSettings:ExpiryInMinutes"
              helperText="Use colon notation for nested settings"
            />
            
            <TextField
              fullWidth
              label="Setting Value"
              value={newSetting.settingValue}
              onChange={(e) => setNewSetting(prev => ({ ...prev, settingValue: e.target.value }))}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Data Type"
                value={newSetting.dataType}
                onChange={(e) => setNewSetting(prev => ({ ...prev, dataType: e.target.value }))}
                SelectProps={{ native: true }}
              >
                <option value="string">String</option>
                <option value="int">Integer</option>
                <option value="bool">Boolean</option>
                <option value="decimal">Decimal</option>
                <option value="json">JSON</option>
              </TextField>
              
              <TextField
                fullWidth
                select
                label="Category"
                value={newSetting.category}
                onChange={(e) => setNewSetting(prev => ({ ...prev, category: parseInt(e.target.value) }))}
                SelectProps={{ native: true }}
              >
                <option value={0}>System</option>
                <option value={1}>JWT Configuration</option>
                <option value={2}>Payment Gateways</option>
                <option value={3}>Cache Configuration</option>
                <option value={4}>Outbox Dispatcher</option>
                <option value={5}>Banking & SMS</option>
                <option value={6}>Raast Payments</option>
                <option value={7}>Logging</option>
                <option value={8}>Security</option>
              </TextField>
            </Box>
            
            <TextField
              fullWidth
              label="Description"
              value={newSetting.description}
              onChange={(e) => setNewSetting(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
            />
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSetting.isActive}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newSetting.isSensitive}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, isSensitive: e.target.checked }))}
                  />
                }
                label="Sensitive (masked in UI)"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={createSetting} 
            variant="contained"
            disabled={saving || !newSetting.settingKey || !newSetting.settingValue}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettingsPage;