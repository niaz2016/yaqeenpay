// src/components/rating/RateUserModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import RatingStars from './RatingStars';
import ratingService from '../../services/ratingService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import type { RatingRequest, Rating } from '../../types/rating';
import { RATING_CATEGORIES } from '../../types/rating';

interface RateUserModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeRole: 'buyer' | 'seller';
  existingRating?: Rating; // If provided, modal will be in edit mode
  onRatingSubmitted?: () => void;
}

const RateUserModal: React.FC<RateUserModalProps> = ({
  open,
  onClose,
  orderId,
  revieweeId,
  revieweeName,
  revieweeRole,
  existingRating,
  onRatingSubmitted,
}) => {
  const isEditMode = !!existingRating;
  
  const [score, setScore] = useState<number>(existingRating?.score || 5);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [category, setCategory] = useState<string>(existingRating?.category || 'overall');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleSuccess } = useErrorHandler();

  // Update form when existingRating changes
  useEffect(() => {
    if (existingRating) {
      setScore(existingRating.score);
      setComment(existingRating.comment || '');
      setCategory(existingRating.category);
    } else {
      setScore(5);
      setComment('');
      setCategory('overall');
    }
  }, [existingRating, open]);

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Please select a rating');
      return;
    }

    // Ensure score is an integer (1-5) as required by backend
    const integerScore = Math.round(score);
    if (integerScore < 1 || integerScore > 5) {
      setError('Rating must be between 1 and 5 stars');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode && existingRating) {
        // Update existing rating - backend expects full RatingRequestDto
        const updateRequest: RatingRequest = {
          orderId,
          revieweeId,
          score: integerScore,
          comment: comment.trim() || undefined,
          category: category as any,
        };
        await ratingService.updateRating(existingRating.id, updateRequest);
        handleSuccess(`Rating updated successfully!`);
      } else {
        // Create new rating
        const request: RatingRequest = {
          orderId,
          revieweeId,
          score: integerScore,
          comment: comment.trim() || undefined,
          category: category as any,
        };

        await ratingService.submitRating(request);
        handleSuccess(`Rating submitted successfully for ${revieweeName}!`);
      }
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      onClose();
    } catch (err) {
      handleError(err, 'RateUserModal.submit', `Failed to ${isEditMode ? 'update' : 'submit'} rating`);
      setError(`Failed to ${isEditMode ? 'update' : 'submit'} rating. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      // Don't reset if we have existingRating (edit mode)
      if (!existingRating) {
        setScore(5);
        setComment('');
        setCategory('overall');
      }
      setError(null);
      onClose();
    }
  };

  // Calculate days since rating for edit warning
  const daysSinceRating = existingRating 
    ? Math.floor((new Date().getTime() - new Date(existingRating.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysRemaining = 30 - daysSinceRating;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? `Edit Rating for ${revieweeName}` : `Rate ${revieweeName}`}
        <Typography variant="caption" color="text.secondary" display="block">
          As {revieweeRole === 'buyer' ? 'Buyer' : 'Seller'}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isEditMode && daysRemaining > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You can edit this rating for {daysRemaining} more day{daysRemaining !== 1 ? 's' : ''}.
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={3} mt={2}>
          {/* Star Rating */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Overall Rating *
            </Typography>
            <RatingStars
              value={score}
              readonly={false}
              showValue={true}
              showTotal={false}
              size="large"
              onChange={setScore}
            />
          </Box>

          {/* Category */}
          <FormControl fullWidth>
            <InputLabel>Rating Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Rating Category"
            >
              {RATING_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Comment */}
          <TextField
            label="Comment (Optional)"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience with ${revieweeName}...`}
            fullWidth
            inputProps={{ maxLength: 500 }}
            helperText={`${comment.length}/500 characters`}
          />

          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            💡 Your honest feedback helps the community make better decisions. Ratings can be edited within 30 days.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || score === 0}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Rating' : 'Submit Rating')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RateUserModal;
