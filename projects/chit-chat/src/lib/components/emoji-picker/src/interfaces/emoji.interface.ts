export interface Emoji {
	name: string;
	value: string;
	shortname: string;
	category: EmojiCategory;
	order: number;
	skinTones?: AlternativeSkinTone[];
	keywords: string[];
}

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

export const emojiCategories = [
	'recent',
	'smileys-people',
	'animals-nature',
	'food-drink',
	'travel-places',
	'objects',
	'activities',
	'symbols',
	'flags',
] as const;

export type EmojiCategory = (typeof emojiCategories)[number];

export interface GroupedEmoji {
	category: EmojiCategory;
	emojis: Emoji[];
}
