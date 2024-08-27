/**
 * An array of supported language codes.
 * @group Constants
 * @type {ReadonlyArray<string>}
 */
export const languages = ['en', 'nl', 'fr', 'de'] as const;

/**
 * A type representing a language code.
 * This can be one of the predefined language codes from the `languages` array or any custom string.
 * @group Types
 * @typedef {('en' | 'nl' | 'fr' | 'de') | string} Language
 */
export type Language = (typeof languages)[number] | string;
