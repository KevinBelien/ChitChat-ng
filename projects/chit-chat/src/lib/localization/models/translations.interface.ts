import { Language } from '../data/languages';

export type LocaleTranslations = Map<Language, Translations>;

export type Translations = Map<string, string>;
