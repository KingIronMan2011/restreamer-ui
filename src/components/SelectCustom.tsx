import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import React from 'react';

function isCustomOption(value: any, options: any) {
  for (let o of options) {
    if (o.value === value) {
      return false;
    }
  }

  return true;
}

export default function Component({
  variant = 'outlined',
  label = '',
  value = '',
  disabled = false,
  customKey = 'custom',
  customLabel = '',
  allowCustom = false,
  options = [],
  onChange = function (event: any) {},
}: any) {
  const [$value, setValue] = React.useState<Record<string, any>>({
    value: value,
    isCustom: isCustomOption(value, options),
    custom: isCustomOption(value, options) === true ? value : '',
  });

  const handleChange = (event: any) => {
    const v = event.target.value;

    const value = $value;

    value.isCustom = v === customKey ? true : false;
    if (value.isCustom === true) {
      value.custom = value.value;
    }
    value.value = v;

    setValue({
      ...$value,
      value: v,
      isCustom: v === customKey ? true : false,
    });

    onChange({
      target: {
        value: v === customKey ? value.custom : value.value,
      },
    });
  };

  const handleCustomChange = (event: any) => {
    setValue({
      ...$value,
      custom: event.target.value,
    });

    onChange(event);
  };

  const selectOptions: any[] = [];

  for (let o of options) {
    selectOptions.push(
      <MenuItem key={o.value} value={o.value} disabled={o.disabled === true}>
        {o.label}
      </MenuItem>,
    );
  }

  return (
    <Grid container spacing={2}>
      {allowCustom === true ? (
        <React.Fragment>
          {$value.isCustom === true ? (
            <React.Fragment>
              <Grid size={6}>
                <FormControl variant={variant} fullWidth>
                  <InputLabel>{label}</InputLabel>
                  <Select
                    value={$value.isCustom === false ? $value.value : customKey}
                    onChange={handleChange}
                    disabled={disabled}
                    label={label}
                  >
                    {selectOptions}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <TextField
                  variant={variant}
                  fullWidth
                  disabled={disabled === true || $value.isCustom === false}
                  label={customLabel ? customLabel : label}
                  value={$value.custom}
                  onChange={handleCustomChange}
                />
              </Grid>
            </React.Fragment>
          ) : (
            <Grid size={12}>
              <FormControl variant={variant} fullWidth>
                <InputLabel>{label}</InputLabel>
                <Select
                  value={$value.isCustom === false ? $value.value : customKey}
                  onChange={handleChange}
                  disabled={disabled}
                  label={label}
                >
                  {selectOptions}
                </Select>
              </FormControl>
            </Grid>
          )}
        </React.Fragment>
      ) : (
        <Grid size={12}>
          <FormControl variant={variant} fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
              value={$value.value}
              onChange={handleChange}
              disabled={disabled}
              label={label}
            >
              {selectOptions}
            </Select>
          </FormControl>
        </Grid>
      )}
    </Grid>
  );
}
