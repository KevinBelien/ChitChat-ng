import { Language } from './languages.type';

export type LocaleTranslations = Map<Language, Translations>;

export type Translations = Map<string, string>;
