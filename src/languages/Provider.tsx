import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import React from 'react';

import { messages as DA } from './da/messages.js';
import { messages as DE } from './de/messages.js';
import { messages as EL } from './el/messages.js';
import { messages as EN } from './en/messages.js';
import { messages as ES } from './es/messages.js';
import { messages as FR } from './fr/messages.js';
import { messages as IT } from './it/messages.js';
import { messages as KO } from './ko/messages.js';
import { messages as PL } from './pl/messages.js';
import { messages as PT } from './pt-br/messages.js';
import { messages as RU } from './ru/messages.js';
import { messages as SL } from './sl/messages.js';
import { messages as TR } from './tr/messages.js';
import { messages as UK } from './uk/messages.js';
import { messages as ZH } from './zh-hans/messages.js';
import * as Storage from '../utils/storage';

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
  return <I18nProvider i18n={i18n}>{props.children}</I18nProvider>;
}
