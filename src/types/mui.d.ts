import type { CSSProperties } from 'react';
import type { Theme } from '@mui/material/styles';

declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends Theme {}
}

declare module '@mui/material/styles' {
  interface TypeBackground {
    accordion: string;
    accordion_border: string;
    box_default: string;
    box_danger: string;
    button_disabled: string;
    dark1: string;
    dark2: string;
    footer1: string;
    footer2: string;
    light1: string;
    modal: string;
    modalbox: string;
  }

  interface Palette {
    default: Palette['primary'];
    service: Palette['primary'];
    selected: Palette['primary'];
  }

  interface PaletteOptions {
    default?: PaletteOptions['primary'];
    service?: PaletteOptions['primary'];
    selected?: PaletteOptions['primary'];
  }

  interface TypographyVariants {
    body3: CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
  }
}
