import { Emoji, SuggestionEmojis } from '.';

export type EmojiRowGenerationConfig = {
	emojiSize: number;
	viewportWidth: number;
	itemSizeMultiplier: number;
	generateCategoryRows: boolean;
} & (
	| {
			type: 'suggestions';
			emojis: SuggestionEmojis;
	  }
	| {
			type: 'filter' | 'default';
			emojis: Emoji[];
	  }
);
