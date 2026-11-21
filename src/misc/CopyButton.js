import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import Button from '@mui/material/Button';
import React, { useContext } from 'react';

import NotifyContext from '../contexts/Notify';
import CopyToClipboard from '../utils/clipboard';

export default function CopyButton({
  variant = 'outlined',
  color = 'default',
  size = 'small',
  value = '',
  children = null,
}) {
  const notify = useContext(NotifyContext);
  const { i18n } = useLingui();

  const handleCopy = async () => {
    const success = await CopyToClipboard(value);

    if (success === true) {
      notify.Dispatch(
        'success',
        'clipboard',
        i18n._(t`Data copied to clipboard`),
      );
    } else {
      notify.Dispatch(
        'error',
        'clipboard',
        i18n._(t`Error while copying data to clipboard`),
      );
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      endIcon={<FileCopyIcon />}
      onClick={handleCopy}
    >
      {children}
    </Button>
  );
}
