import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import ModalContent from '../ModalContent';
import Textarea from '../Textarea';

const useStyles = () => {
  const theme = useTheme();
  return {
    box: {
      backgroundColor: theme.palette.background.modalbox,
      borderRadius: 4,
      padding: '0em 1em 1em 1em',
    },
  };
};

const Component = function ({
  open = false,
  title = '',
  value = '',
  rows = 0,
  scrollTo = 'bottom',
  readOnly = true,
  allowCopy = true,
  onClose = null as (() => void) | null,
  onHelp = null as (() => void) | null,
}: any) {
  const classes = useStyles();

  return (
    <Modal open={open} onClose={onClose} className="modal">
      <ModalContent
        title={title}
        onClose={onClose}
        onHelp={onHelp}
        style={{ overflow: 'hidden' }}
      >
        <Grid container spacing={1}>
          <Grid size={12}>
            <Stack
              direction="column"
              spacing={1}
              sx={[
                classes.box,
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Textarea
                value={value}
                rows={rows}
                scrollTo={scrollTo}
                readOnly={readOnly}
                allowCopy={allowCopy}
              />
            </Stack>
          </Grid>
        </Grid>
      </ModalContent>
    </Modal>
  );
};

export default Component;
