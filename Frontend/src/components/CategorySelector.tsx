import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Category } from '../services/categoryService';

interface Props {
  categories: Category[];
  value?: string; // selected category id
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}

const CategorySelector: React.FC<Props> = ({ categories, value, onChange, disabled }) => {
  const [level1, setLevel1] = useState<string>('');
  const [level2, setLevel2] = useState<string>('');
  const [level3, setLevel3] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [stage, setStage] = useState<number>(1); // 1,2,3 to control sliding panels

  // Helpers to find category nodes
  const findCategoryById = (cats: Category[], id?: string | null): Category | undefined => {
    if (!id) return undefined;
    for (const c of cats) {
      if (c.id === id) return c;
      if (c.subCategories && c.subCategories.length > 0) {
        const found = findCategoryById(c.subCategories, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Build ancestors for a selected id
  const buildAncestorIds = (id?: string | null) => {
    if (!id) return { l1: '', l2: '', l3: '' };
    // search top-level
    for (const c1 of categories) {
      if (c1.id === id) return { l1: c1.id, l2: '', l3: '' };
      if (c1.subCategories) {
        for (const c2 of c1.subCategories) {
          if (c2.id === id) return { l1: c1.id, l2: c2.id, l3: '' };
          if (c2.subCategories) {
            for (const c3 of c2.subCategories) {
              if (c3.id === id) return { l1: c1.id, l2: c2.id, l3: c3.id };
            }
          }
        }
      }
    }
    return { l1: '', l2: '', l3: '' };
  };

  // Initialize selection from value prop
  useEffect(() => {
    const { l1, l2, l3 } = buildAncestorIds(value);
    setLevel1(l1);
    setLevel2(l2);
    setLevel3(l3 || value || '');
  }, [value, categories]);

  const level1Options = categories;
  const level2Options = level1 ? (findCategoryById(categories, level1)?.subCategories ?? []) : [];
  const level3Options = level2 ? (findCategoryById(categories, level2)?.subCategories ?? []) : [];

  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    setAnchorEl(e.currentTarget);
    // reset stage to show current selection depth
    const depth = level3 ? 3 : level2 ? 2 : 1;
    setStage(depth || 1);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelectLeaf = (id: string) => {
    // when a leaf is selected, notify and close
    onChange(id);
    // update local state for display
    const { l1, l2, l3 } = buildAncestorIds(id);
    setLevel1(l1);
    setLevel2(l2);
    setLevel3(l3 || id);
    handleClose();
  };

  const handleBack = () => {
    setStage((s) => Math.max(1, s - 1));
  };

  // Show only the final (deepest) selected category name in the button
  const currentLabel = () => {
    if (level3) {
      const node = findCategoryById(categories, level3);
      if (node) return node.name;
    }
    if (level2) {
      const node = findCategoryById(categories, level2);
      if (node) return node.name;
    }
    if (level1) {
      const node = findCategoryById(categories, level1);
      if (node) return node.name;
    }
    return 'Select category';
  };

  const getCurrentCategoryTitle = () => {
    if (stage === 1) return 'Select Category';
    if (stage === 2 && level1) {
      const node = findCategoryById(categories, level1);
      return node?.name || 'Subcategories';
    }
    if (stage === 3 && level2) {
      const node = findCategoryById(categories, level2);
      return node?.name || 'Options';
    }
    return 'Select';
  };
  // build the menu content once and reuse for popover/dialog
  const panelWidthPercent = isMobile ? 100 : 100 / 3;
  const containerWidth = 3 * panelWidthPercent;

  const menuContent = (
    <Box sx={{ width: '100%', p: 0 }}>
      {/* sliding window */}
      <Box sx={{ overflow: 'hidden', width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            width: `${containerWidth}%`,
            // On mobile we slide panels using transform; on desktop keep all three panels visible (no translate)
            transform: isMobile ? `translateX(-${(stage - 1) * panelWidthPercent}%)` : 'translateX(0%)',
            transition: isMobile ? 'transform 300ms ease' : 'none',
          }}
        >
          <Box sx={{ width: `${panelWidthPercent}%`, minWidth: isMobile ? '100%' : 180, maxHeight: isMobile ? 400 : 360, overflow: 'auto', borderRight: isMobile ? 0 : 1, borderColor: 'divider' }}>
            <List dense sx={{ py: 0 }}>
              <ListItemButton 
                onClick={() => { setLevel1(''); setLevel2(''); setLevel3(''); onChange(''); handleClose(); }} 
                selected={level1 === ''}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemText primary={<Typography variant="body2" fontWeight={level1 === '' ? 600 : 400}>All Categories</Typography>} />
              </ListItemButton>
              {level1Options.map((c) => (
                <ListItemButton
                  key={c.id}
                  onClick={() => {
                    // Category name clicked: select this category immediately
                    setLevel1(c.id);
                    setLevel2('');
                    setLevel3('');
                    handleSelectLeaf(c.id);
                  }}
                  selected={level1 === c.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemText 
                    primary={<Typography variant="body2" fontWeight={level1 === c.id ? 600 : 400}>{c.name}</Typography>}
                    sx={{ cursor: 'pointer' }}
                  />
                  {c.subCategories && c.subCategories.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Arrow clicked: toggle expansion only, don't close dropdown
                        if (level1 === c.id) {
                          if (stage === 1) {
                            setStage(2);
                          } else {
                            setStage(1);
                          }
                        } else {
                          setLevel1(c.id);
                          setLevel2('');
                          setLevel3('');
                          setStage(2);
                        }
                      }}
                      sx={{
                        ml: 0.5,
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </IconButton>
                  )}
                </ListItemButton>
              ))}
            </List>
          </Box>

          <Box sx={{ width: `${panelWidthPercent}%`, minWidth: isMobile ? '100%' : 180, maxHeight: isMobile ? 400 : 360, overflow: 'auto', borderRight: isMobile ? 0 : 1, borderColor: 'divider' }}>
            <List dense sx={{ py: 0 }}>
              <ListItemButton disabled sx={{ backgroundColor: 'background.default' }}>
                <ListItemText primary={<Typography variant="subtitle2" fontWeight={600} color="text.secondary">Subcategories</Typography>} />
              </ListItemButton>
              {level2Options.length === 0 ? (
                <ListItemButton disabled>
                  <ListItemText primary={<Typography variant="body2" color="text.secondary">—</Typography>} />
                </ListItemButton>
              ) : (
                level2Options.map((c) => (
                  <ListItemButton
                    key={c.id}
                    onClick={() => {
                      // Category name clicked: select this category immediately
                      setLevel2(c.id);
                      setLevel3('');
                      handleSelectLeaf(c.id);
                    }}
                    selected={level2 === c.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemText 
                      primary={<Typography variant="body2" fontWeight={level2 === c.id ? 600 : 400}>{c.name}</Typography>}
                      sx={{ cursor: 'pointer' }}
                    />
                    {c.subCategories && c.subCategories.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Arrow clicked: toggle expansion only, don't close dropdown
                          if (level2 === c.id) {
                            if (stage === 2) {
                              setStage(3);
                            } else {
                              setStage(2);
                            }
                          } else {
                            setLevel2(c.id);
                            setLevel3('');
                            setStage(3);
                          }
                        }}
                        sx={{
                          ml: 0.5,
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                        }}
                      >
                        <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </IconButton>
                    )}
                  </ListItemButton>
                ))
              )}
            </List>
          </Box>

          <Box sx={{ width: `${panelWidthPercent}%`, minWidth: isMobile ? '100%' : 160, maxHeight: isMobile ? 400 : 360, overflow: 'auto' }}>
            <List dense sx={{ py: 0 }}>
              <ListItemButton disabled sx={{ backgroundColor: 'background.default' }}>
                <ListItemText primary={<Typography variant="subtitle2" fontWeight={600} color="text.secondary">Options</Typography>} />
              </ListItemButton>
              {level3Options.length === 0 ? (
                <ListItemButton disabled>
                  <ListItemText primary={<Typography variant="body2" color="text.secondary">—</Typography>} />
                </ListItemButton>
              ) : (
                level3Options.map((c) => (
                  <ListItemButton 
                    key={c.id} 
                    onClick={() => handleSelectLeaf(c.id)} 
                    selected={level3 === c.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemText primary={<Typography variant="body2" fontWeight={level3 === c.id ? 600 : 400}>{c.name}</Typography>} />
                  </ListItemButton>
                ))
              )}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Button 
        variant="outlined" 
        onClick={handleOpen} 
        disabled={disabled}
        sx={{
          justifyContent: 'space-between',
          textAlign: 'left',
          textTransform: 'none',
          px: 2,
          py: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        fullWidth
      >
        <Typography 
          variant="body2" 
          sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            color: (level1 || level2 || level3) ? 'text.primary' : 'text.secondary',
          }}
        >
          {currentLabel()}
        </Typography>
        <ChevronRightIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
      </Button>

      {!isMobile ? (
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ 
            sx: { 
              zIndex: (theme) => theme.zIndex.modal + 10, 
              width: 540, 
              maxWidth: '95vw',
              boxShadow: 3,
              borderRadius: 2,
            } 
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              px: 2, 
              py: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: 'background.default',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {getCurrentCategoryTitle()}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleClose} aria-label="close">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {menuContent}
          </Box>
        </Popover>
      ) : (
        <Dialog 
          fullWidth 
          maxWidth="sm" 
          open={open} 
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '80vh',
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            pb: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {stage > 1 && (
                <IconButton edge="start" onClick={handleBack} aria-label="back">
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Typography variant="h6" fontWeight={600}>
                {getCurrentCategoryTitle()}
              </Typography>
            </Box>
            <IconButton edge="end" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: 0, py: 0 }}>
            {menuContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CategorySelector;
