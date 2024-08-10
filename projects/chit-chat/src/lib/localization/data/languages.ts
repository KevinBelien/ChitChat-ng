export const languages = ['en', 'nl', 'fr', 'de'] as const;

export type Language = (typeof languages)[number] | string;
