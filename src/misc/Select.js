import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import React from 'react';

export default function Component({
  variant = 'outlined',
  label = '',
  value = '',
  disabled = false,
  onChange = function (event) {},
  children = null,
}) {
  return (
    <FormControl variant={variant} fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled}
        label={label}
        MenuProps={{ disableScrollLock: true }}
      >
        {children}
      </Select>
    </FormControl>
  );
}
