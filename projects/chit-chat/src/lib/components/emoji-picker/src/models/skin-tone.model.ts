export interface AlternativeSkinTone {
	skinTone: SkinTone;
	value: string;
	order: number;
}

export const skinTones = [
	'default',
	'light',
	'medium-light',
	'medium',
	'medium-dark',
	'dark',
] as const;

export type SkinTone = (typeof skinTones)[number];
