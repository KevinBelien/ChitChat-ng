export const emojiCategories = [
	'suggestions',
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
