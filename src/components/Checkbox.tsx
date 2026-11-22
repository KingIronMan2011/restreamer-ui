import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTheme } from '@mui/material/styles';
import React from 'react';

const useStyles = () => {
  const theme = useTheme();
  return {
    root: {
      color: theme.palette.text.primary,
      '&.Mui-checked': {
        color: theme.palette.text.primary,
      },
      '&.Mui-disabled': {
        color: theme.palette.text.disabled,
      },
    },
    checked: {},
    disabled: {},
  };
};

export default function Component({
  label = '',
  checked = false,
  disabled = false,
  onChange = function (event: any) {},
}: any) {
  const classes = useStyles();

  return (
    <FormControlLabel
      sx={classes.root}
      control={
        <Checkbox sx={classes.root} checked={checked} onChange={onChange} />
      }
      label={label}
      disabled={disabled}
    />
  );
}
