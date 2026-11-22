import CardMedia from '@mui/material/CardMedia';
import React from 'react';

const useStyles = () => {
  return {
    media: {
      paddingTop: '39.25%',
      borderRadius: 4,
    },
  };
};

export default function Component({
  image = '',
  title = '',
  height = '0px',
}: any) {
  const classes = useStyles();

  return (
    <CardMedia
      sx={classes.media}
      style={{ height: height }}
      image={image}
      title={title}
    />
  );
}
