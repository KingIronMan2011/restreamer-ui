import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import Env from './Env';

export default function Component({
  id = null,
  label = '',
  value = '',
  disabled = false,
  multiline = false,
  rows = 1,
  env = false,
  type = 'text',
  min = null,
  max = null,
  helperText = null,
  error = false,
  onChange = function (value: any) {},
}: any) {
  id = id === null ? uuidv4() : id;
  let adornment = null;

  if (env) {
    adornment = (
      <InputAdornment position="end">
        <Env />
      </InputAdornment>
    );
  }

  let inputProps: Record<string, any> = {};

  if (min !== null) {
    inputProps.min = min;
  }

  if (max !== null) {
    inputProps.max = max;
  }

  return (
    <FormControl variant="outlined" disabled={disabled} fullWidth>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <OutlinedInput
        id={id}
        value={value}
        onChange={onChange}
        endAdornment={adornment}
        label={label}
        multiline={multiline}
        rows={rows}
        type={type}
        error={error}
        slotProps={{ input: inputProps }}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
