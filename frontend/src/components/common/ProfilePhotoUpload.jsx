import React, { useRef, useState } from 'react';
import { Avatar, Box, Tooltip, IconButton, CircularProgress } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import toast from 'react-hot-toast';

/**
 * Reusable profile photo avatar with click-to-upload.
 *
 * Props:
 *   src        – current photo URL (optional)
 *   name       – full name used for initials fallback
 *   size       – avatar diameter in px (default 90)
 *   bgcolor    – MUI color token for the avatar background (default 'secondary.main')
 *   canEdit    – show the camera button (default true)
 *   onUpload   – async (file: File) => void   called when user picks a file
 */
const ProfilePhotoUpload = ({
  src,
  name = '',
  size = 90,
  bgcolor = 'secondary.main',
  canEdit = true,
  onUpload,
}) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [localSrc, setLocalSrc] = useState(null);

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setLocalSrc(objectUrl);
    setUploading(true);

    try {
      await onUpload(file);
      toast.success('Photo updated');
    } catch {
      toast.error('Failed to upload photo');
      setLocalSrc(null);           // roll back preview on error
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      e.target.value = '';
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Avatar
        src={localSrc || src}
        sx={{
          width: size,
          height: size,
          mx: 'auto',
          bgcolor,
          fontSize: Math.round(size * 0.36),
        }}
      >
        {initials || '?'}
      </Avatar>

      {canEdit && (
        <>
          <Tooltip title="Change photo">
            <IconButton
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              size="small"
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                bgcolor: 'primary.main',
                color: 'white',
                width: 28,
                height: 28,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {uploading
                ? <CircularProgress size={12} color="inherit" />
                : <PhotoCamera sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleChange}
          />
        </>
      )}
    </Box>
  );
};

export default ProfilePhotoUpload;
