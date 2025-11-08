import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Slider,
  Card,
  CardHeader,
  Chip,
  Avatar,
  Stack,
  RadioGroup,
  Radio,
  FormLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Accessibility as AccessibilityIcon,
  TextFields as TextIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SettingsBrightness as AutoModeIcon,
  Schedule as TimeIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useSettings } from '../../../context/SettingsContext';
import { SettingsCategory } from '../../../services/settingsService';
import type { AppearanceSettings as AppearanceSettingsType } from '../../../services/settingsService';
import TopRightToast from '../../../components/TopRightToast';

const themes = [
  { value: 'light', label: 'Light', icon: <LightModeIcon />, description: 'Clean and bright interface' },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon />, description: 'Easy on the eyes in low light' },
  { value: 'auto', label: 'System', icon: <AutoModeIcon />, description: 'Follows your system preference' },
];

const languages = [
  { value: 'en', label: 'English', flag: '🇺🇸', region: 'United States' },
  { value: 'ur', label: 'اردو', flag: '🇵🇰', region: 'Pakistan' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦', region: 'Arabic' },
  { value: 'es', label: 'Español', flag: '🇪🇸', region: 'Spain' },
  { value: 'fr', label: 'Français', flag: '🇫🇷', region: 'France' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '06/10/2025' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '10/06/2025' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2025-10-06' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', example: '06 Oct 2025' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY', example: 'Oct 06, 2025' },
];

const timeFormats = [
  { value: '12h', label: '12-hour (AM/PM)', example: '9:30 PM' },
  { value: '24h', label: '24-hour', example: '21:30' },
];

const densityOptions = [
  { value: 'comfortable', label: 'Comfortable', description: 'More spacing for easier interaction' },
  { value: 'standard', label: 'Standard', description: 'Balanced spacing and content density' },
  { value: 'compact', label: 'Compact', description: 'Less spacing, more content visible' },
];

const AppearanceSettings: React.FC = () => {
  const { settings, updateSetting, loading: contextLoading } = useSettings();
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettingsType>({
    theme: 'light',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    density: 'standard',
    highContrastMode: false,
    fontSize: 16,
    reducedAnimations: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.appearance) {
      setAppearanceSettings(settings.appearance);
    }
  }, [settings]);

  const handleInputChange = (field: keyof AppearanceSettingsType, value: any) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const success = await updateSetting(SettingsCategory.Appearance, appearanceSettings);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Apply theme change immediately for demo purposes
        if (appearanceSettings.theme !== settings?.appearance?.theme) {
          document.documentElement.setAttribute('data-theme', appearanceSettings.theme);
        }
      } else {
        setError('Failed to update appearance settings');
      }
    } catch (err) {
      setError('An error occurred while saving settings');
    } finally {
      setLoading(false);
      setPreviewTheme(null);
    }
  };

  const handlePreviewTheme = (theme: string) => {
    setPreviewTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Reset preview after 3 seconds
    setTimeout(() => {
      if (previewTheme === theme) {
        setPreviewTheme(null);
        document.documentElement.setAttribute('data-theme', appearanceSettings.theme);
      }
    }, 3000);
  };

  const getFontSizeLabel = (value: number) => {
    if (value <= 12) return 'Very Small';
    if (value <= 14) return 'Small';
    if (value <= 16) return 'Medium';
    if (value <= 18) return 'Large';
    return 'Very Large';
  };

  if (contextLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TopRightToast open={success} message={'Appearance settings updated successfully!'} severity="success" onClose={() => setSuccess(false)} />
      <TopRightToast open={Boolean(error)} message={error || ''} severity="error" onClose={() => setError('')} />
      <TopRightToast open={Boolean(previewTheme)} message={`Previewing ${themes.find(t => t.value === previewTheme)?.label} theme. Changes will revert in 3 seconds.`} severity="info" onClose={() => setPreviewTheme(null)} autoHideDuration={3000} />

      {/* Theme Settings */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PaletteIcon />
          <Typography variant="h6">
            Theme & Colors
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose how YaqeenPay looks and feels to you.
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
          gap: 2 
        }}>
          {themes.map((theme) => (
            <Card 
              key={theme.value}
              variant={appearanceSettings.theme === theme.value ? 'elevation' : 'outlined'}
              sx={{ 
                cursor: 'pointer',
                border: appearanceSettings.theme === theme.value ? 2 : 1,
                borderColor: appearanceSettings.theme === theme.value ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                }
              }}
              onClick={() => handleInputChange('theme', theme.value)}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {theme.icon}
                  </Avatar>
                }
                title={theme.label}
                subheader={theme.description}
                action={
                  <Button 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewTheme(theme.value);
                    }}
                  >
                    Preview
                  </Button>
                }
              />
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={appearanceSettings.highContrastMode}
                onChange={(e) => handleInputChange('highContrastMode', e.target.checked)}
              />
            }
            label="High contrast mode"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
            Increases color contrast for better visibility
          </Typography>
        </Box>
      </Paper>

      {/* Language & Region */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LanguageIcon />
          <Typography variant="h6">
            Language & Region
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ maxWidth: { md: '50%' } }}>
          <InputLabel>Display Language</InputLabel>
          <Select
            value={appearanceSettings.language}
            label="Display Language"
            onChange={(e) => handleInputChange('language', e.target.value)}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography>{lang.flag}</Typography>
                  <Box>
                    <Typography>{lang.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang.region}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Date & Time Format */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TimeIcon />
          <Typography variant="h6">
            Date & Time Format
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Date Format</InputLabel>
            <Select
              value={appearanceSettings.dateFormat}
              label="Date Format"
              onChange={(e) => handleInputChange('dateFormat', e.target.value)}
            >
              {dateFormats.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  <Box>
                    <Typography>{format.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Example: {format.example}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Time Format</InputLabel>
            <Select
              value={appearanceSettings.timeFormat}
              label="Time Format"
              onChange={(e) => handleInputChange('timeFormat', e.target.value)}
            >
              {timeFormats.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  <Box>
                    <Typography>{format.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Example: {format.example}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Layout & Density */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <VisibilityIcon />
          <Typography variant="h6">
            Layout & Density
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Customize how much content is displayed and spacing between elements.
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 4 }}>
          <FormLabel component="legend">Content Density</FormLabel>
          <RadioGroup
            value={appearanceSettings.density}
            onChange={(e) => handleInputChange('density', e.target.value)}
          >
            {densityOptions.map((option) => (
              <Box key={option.value}>
                <FormControlLabel
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -1, mb: 1 }}>
                  {option.description}
                </Typography>
              </Box>
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      {/* Typography */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextIcon />
          <Typography variant="h6">
            Typography
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography gutterBottom>
            Font Size: {getFontSizeLabel(appearanceSettings.fontSize)} ({appearanceSettings.fontSize}px)
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={appearanceSettings.fontSize}
              onChange={(_, value) => handleInputChange('fontSize', value)}
              min={12}
              max={24}
              step={2}
              marks={[
                { value: 12, label: '12px' },
                { value: 16, label: '16px' },
                { value: 20, label: '20px' },
                { value: 24, label: '24px' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 2, 
              fontSize: `${appearanceSettings.fontSize}px`,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              backgroundColor: 'background.paper'
            }}
          >
            Sample text: This is how text will appear with your selected font size.
          </Typography>
        </Box>
      </Paper>

      {/* Accessibility */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccessibilityIcon />
          <Typography variant="h6">
            Accessibility
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Options to make YaqeenPay more accessible and comfortable to use.
        </Typography>

        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={appearanceSettings.reducedAnimations}
                onChange={(e) => handleInputChange('reducedAnimations', e.target.checked)}
              />
            }
            label="Reduce animations and motion"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
            Minimizes animations for users sensitive to motion or to improve performance
          </Typography>
        </Stack>
      </Paper>

      {/* Preview Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preview
        </Typography>
        <Box 
          sx={{ 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1, 
            p: 2,
            backgroundColor: 'background.paper',
            fontSize: `${appearanceSettings.fontSize}px`,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Sample Content
          </Typography>
          <Typography paragraph>
            This is how your content will appear with the selected appearance settings. 
            The theme is set to <Chip label={themes.find(t => t.value === appearanceSettings.theme)?.label} size="small" />, 
            language is <Chip label={languages.find(l => l.value === appearanceSettings.language)?.label} size="small" />, 
            and density is <Chip label={densityOptions.find(d => d.value === appearanceSettings.density)?.label} size="small" />.
          </Typography>
          <Typography variant="caption">
            Current date and time: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => {
            // Reset to saved settings
            if (settings?.appearance) {
              setAppearanceSettings(settings.appearance);
              document.documentElement.setAttribute('data-theme', settings.appearance.theme);
            }
            setPreviewTheme(null);
          }}
          disabled={loading}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default AppearanceSettings;