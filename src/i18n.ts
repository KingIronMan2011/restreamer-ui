import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import React from 'react';

import { messages as DA } from './languages/da/messages.js';
import { messages as DE } from './languages/de/messages.js';
import { messages as EL } from './languages/el/messages.js';
import { messages as EN } from './languages/en/messages.js';
import { messages as ES } from './languages/es/messages.js';
import { messages as FR } from './languages/fr/messages.js';
import { messages as IT } from './languages/it/messages.js';
import { messages as KO } from './languages/ko/messages.js';
import { messages as PL } from './languages/pl/messages.js';
import { messages as PT } from './languages/pt-br/messages.js';
import { messages as RU } from './languages/ru/messages.js';
import { messages as SL } from './languages/sl/messages.js';
import { messages as TR } from './languages/tr/messages.js';
import { messages as UK } from './languages/uk/messages.js';
import { messages as ZH } from './languages/zh-hans/messages.js';
import * as Storage from './utils/storage';

i18n.load({
  en: EN,
  da: DA,
  de: DE,
  el: EL,
  es: ES,
  fr: FR,
  it: IT,
  ko: KO,
  pl: PL,
  'pt-br': PT,
  ru: RU,
  sl: SL,
  tr: TR,
  uk: UK,
  'zh-hans': ZH,
});

const aliases: Record<string, string> = {
  pt: 'pt-br',
  'zh-cn': 'zh-hans',
};

const getAlias = (lang: any) => {
  if (lang in aliases) {
    return aliases[lang];
  }

  return lang;
};

const getLanguage = (defaultLanguage: any, supportedLanguages: any) => {
  let lang = getAlias(Storage.Get('language'));
  if (supportedLanguages.indexOf(lang) === -1) {
    lang = getAlias(getBrowserLanguage(defaultLanguage));

    if (supportedLanguages.indexOf(lang) === -1) {
      lang = defaultLanguage;
    }
  }

  Storage.Set('language', lang);

  return lang;
};

const getBrowserLanguage = (defaultLanguage: any) => {
  let lang = window.navigator.language;

  const match = lang.match(/^[a-z]+(-[a-z]+)?/i);
  if (!match) {
    return defaultLanguage;
  }

  return match[0].toLowerCase();
};

i18n.activate(
  getLanguage('en', [
    'en',
    'da',
    'de',
    'el',
    'es',
    'fr',
    'it',
    'ko',
    'pl',
    'pt-br',
    'ru',
    'sl',
    'tr',
    'uk',
    'zh-hans',
  ]),
);

export default function Provider(props: any) {
  return React.createElement(I18nProvider, { i18n }, props.children);
}
