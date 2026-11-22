import { Trans } from '@lingui/react/macro';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import UploadButton from '../UploadButton';

const imageTypes = [
  { mimetype: 'image/png', extension: 'png', maxSize: 20 * 1024 * 1024 },
  { mimetype: 'image/jpeg', extension: 'jpg', maxSize: 20 * 1024 * 1024 },
  { mimetype: 'image/webp', extension: 'webp', maxSize: 20 * 1024 * 1024 },
];

const maxOverlays = 8;

type Overlay = {
  path: string;
  width: string;
  height: string;
  x: string;
  y: string;
};

type VideoOverlaysProps = {
  settings?: Overlay[];
  profileIndex: number;
  encoder: string;
  onChange: (overlays: Overlay[]) => void;
  onStore: (
    name: string,
    data: File,
    onprogress?: (...args: any[]) => void,
  ) => Promise<string>;
};

const normalizeOverlays = (overlays: Overlay[] = []): Overlay[] =>
  overlays.map((overlay) => ({
    path: overlay.path ?? '',
    width: overlay.width ?? '320',
    height: overlay.height ?? '',
    x: overlay.x ?? '',
    y: overlay.y ?? '',
  }));

export default function VideoOverlays({
  settings = [],
  profileIndex,
  encoder,
  onChange,
  onStore,
}: VideoOverlaysProps) {
  const overlays = normalizeOverlays(settings);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');

  const updateOverlay = (index: number, update: Partial<Overlay>) => {
    onChange(
      overlays.map((overlay, overlayIndex) =>
        overlayIndex === index ? { ...overlay, ...update } : overlay,
      ),
    );
  };

  const handleUpload =
    (index: number) => async (file: File, extension: string) => {
      setUploadError('');
      setUploading(true);

      try {
        const fileName = `overlay-${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const path = await onStore(fileName, file);
        if (!path) {
          throw new Error('The uploaded image path was empty.');
        }

        updateOverlay(index, { path });
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Unknown upload error',
        );
      } finally {
        setUploading(false);
      }
    };

  const handleUploadError = (error: any) => {
    const message =
      error.type === 'size'
        ? 'The selected image exceeds the 20 MB upload limit.'
        : error.type === 'mimetype'
          ? 'Choose a PNG, JPEG, or WebP image.'
          : error.type === 'nofiles'
            ? 'No image was selected.'
            : 'The image could not be read.';
    setUploadError(message);
  };

  const moveOverlay = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= overlays.length) return;

    const next = [...overlays];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addOverlay = () => {
    onChange([
      ...overlays,
      { path: '', width: '320', height: '', x: '', y: '' },
    ]);
  };

  const removeOverlay = (index: number) => {
    onChange(overlays.filter((_, overlayIndex) => overlayIndex !== index));
  };

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="h3">
            <Trans>Video overlays</Trans>
            {profileIndex > 0 ? ` (${profileIndex + 1})` : ''}
          </Typography>
          <Button
            variant="outlined"
            onClick={addOverlay}
            disabled={overlays.length >= maxOverlays || uploading}
          >
            <Trans>Add image</Trans>
          </Button>
        </Box>
      </Grid>
      <Grid size={12}>
        <Typography variant="body2">
          <Trans>
            Uploaded images are burned into this output. Arrange them from
            bottom to top. Leave a position empty to center the image.
          </Trans>
        </Typography>
      </Grid>
      {encoder === 'copy' && overlays.some((overlay) => overlay.path) && (
        <Grid size={12}>
          <Alert severity="warning">
            <Trans>
              Video overlays require encoding. Choose a video encoder instead of
              Copy before saving.
            </Trans>
          </Alert>
        </Grid>
      )}
      {overlays.map((overlay, index) => (
        <React.Fragment key={`${profileIndex}-${index}`}>
          <Grid size={12}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography variant="h4">
                <Trans>Image overlay {index + 1}</Trans>
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <IconButton
                  aria-label="Move overlay up"
                  title="Move overlay up"
                  onClick={() => moveOverlay(index, -1)}
                  disabled={index === 0 || uploading}
                >
                  <ArrowUpwardIcon />
                </IconButton>
                <IconButton
                  aria-label="Move overlay down"
                  title="Move overlay down"
                  onClick={() => moveOverlay(index, 1)}
                  disabled={index === overlays.length - 1 || uploading}
                >
                  <ArrowDownwardIcon />
                </IconButton>
                <IconButton
                  aria-label="Remove overlay"
                  title="Remove overlay"
                  onClick={() => removeOverlay(index)}
                  disabled={uploading}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label={<Trans>Uploaded image path</Trans>}
              value={overlay.path}
              slotProps={{ htmlInput: { readOnly: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <UploadButton
              label={
                uploading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Trans>Upload image</Trans>
                )
              }
              acceptTypes={imageTypes}
              onError={handleUploadError}
              onUpload={handleUpload(index)}
              disabled={uploading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label={<Trans>Width (pixels)</Trans>}
              value={overlay.width}
              slotProps={{ htmlInput: { min: 1, max: 8192 } }}
              onChange={(event) =>
                updateOverlay(index, { width: event.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label={<Trans>Height (optional)</Trans>}
              value={overlay.height}
              slotProps={{ htmlInput: { min: 1, max: 8192 } }}
              onChange={(event) =>
                updateOverlay(index, { height: event.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label={<Trans>X position (pixels)</Trans>}
              value={overlay.x}
              onChange={(event) =>
                updateOverlay(index, { x: event.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label={<Trans>Y position (pixels)</Trans>}
              value={overlay.y}
              onChange={(event) =>
                updateOverlay(index, { y: event.target.value })
              }
            />
          </Grid>
          {index < overlays.length - 1 && (
            <Grid size={12}>
              <Divider />
            </Grid>
          )}
        </React.Fragment>
      ))}
      {uploadError && (
        <Grid size={12}>
          <Alert severity="error" onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
}
