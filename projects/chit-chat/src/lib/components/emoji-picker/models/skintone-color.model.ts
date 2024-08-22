import { Skintone } from './skin-tone.model';

export const skintoneColors: SkintoneColor[] = [
	{ skintone: 'default', color: '#ffc83d' },
	{ skintone: 'light', color: '#ffd7c2' },
	{ skintone: 'medium-light', color: '#eebfaa' },
	{ skintone: 'medium', color: '#c68d7b' },
	{ skintone: 'medium-dark', color: '#966661' },
	{ skintone: 'dark', color: '#573739' },
];

export type SkintoneColor = { skintone: Skintone; color: string };
