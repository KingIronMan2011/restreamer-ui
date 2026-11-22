import Button from '@mui/material/Button';
import React from 'react';

const useStyles = () => {
  return {
    button: {
      fontSize: '.9rem!important',
      height: '56px!important',
    },
  };
};
// component="label" variant={variant} color={color} disabled={disabled}
// onClick disabled
// target="blank" href={stream_key_link} component="a"
export default function Component({
  component = 'button',
  variant = 'outlined',
  size = 'large',
  color = 'primary',
  disabled = false,
  target = 'blank',
  href = undefined,
  className = null,
  onClick = () => {},
  children = null as import('react').ReactNode,
}: any) {
  const classes = useStyles();

  return (
    <Button
      component={component}
      variant={variant}
      size={size}
      disabled={disabled}
      fullWidth
      color={color}
      className={className}
      sx={classes.button}
      target={target}
      href={href}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
