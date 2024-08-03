export interface AlternativeSkintone {
	skintone: Skintone;
	value: string;
	order: number;
}

export const skintones = [
	'default',
	'light',
	'medium-light',
	'medium',
	'medium-dark',
	'dark',
] as const;

export type Skintone = (typeof skintones)[number];
