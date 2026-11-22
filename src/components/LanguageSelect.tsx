import { useLingui } from '@lingui/react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React from 'react';

export default function LanguageSelect({
  onChange = function (lang: any) {},
}: any) {
  const { i18n } = useLingui();

  const handleChange = (event: any) => {
    const language = event.target.value;

    i18n.activate(language);

    onChange(language);
  };

  return (
    <Select
      size="small"
      variant="standard"
      disableUnderline
      displayEmpty
      value={i18n.locale}
      onChange={handleChange}
      onClick={(event) => event.stopPropagation()}
      sx={{
        minWidth: 112,
        borderRadius: 1,
        color: 'inherit',
        fontSize: '1rem',
        '& .MuiSelect-select': {
          padding: '4px 28px 4px 8px',
        },
        '& .MuiSelect-icon': {
          color: 'inherit',
          right: 4,
        },
        '&:hover, &.Mui-focused': {
          backgroundColor: 'action.hover',
        },
        '& .MuiSelect-select:focus': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <MenuItem value="en">English</MenuItem>
      <MenuItem value="da">Dansk</MenuItem>
      <MenuItem value="de">Deutsch</MenuItem>
      <MenuItem value="el">Ελληνικά</MenuItem>
      <MenuItem value="es">Español</MenuItem>
      <MenuItem value="fr">Français</MenuItem>
      <MenuItem value="it">Italiano</MenuItem>
      <MenuItem value="ko">한국어</MenuItem>
      <MenuItem value="pl">Polski</MenuItem>
      <MenuItem value="pt-br">Português</MenuItem>
      <MenuItem value="ru">Русский</MenuItem>
      <MenuItem value="sl">Slovenščina</MenuItem>
      <MenuItem value="tr">Türkçe</MenuItem>
      <MenuItem value="uk">Українська мова</MenuItem>
      <MenuItem value="zh-hans">中文(简体)</MenuItem>
    </Select>
  );
}
