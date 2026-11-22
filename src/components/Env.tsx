import { Trans } from '@lingui/react/macro';
import Chip from '@mui/material/Chip';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import React from 'react';

const useStyles = () => {
  const theme = useTheme();
  return {
    root: {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.error.main,
      borderRadius: 4,
      fontWeight: 'bold',
      height: 20,
    },
    labelSmall: {
      paddingLeft: 6,
      paddingRight: 6,
    },
  };
};

const HtmlTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.text.primary,
    maxWidth: 100,
    fontSize: '.8rem',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.error.main,
  },
}));

export default function Component({ style = null }: any) {
  const classes = useStyles();
  return (
    <HtmlTooltip
      title={
        <React.Fragment>
          <Trans>An environment variable sets this value.</Trans>
        </React.Fragment>
      }
      placement="right"
      arrow
    >
      <Chip
        size="small"
        label="ENV"
        sx={[classes.root, { '& .MuiChip-label': classes.labelSmall }]}
        style={style}
      />
    </HtmlTooltip>
  );
}
