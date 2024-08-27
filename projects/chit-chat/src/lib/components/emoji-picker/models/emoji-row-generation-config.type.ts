import { Emoji, SuggestionEmojis } from '.';

/**
 * Configuration object for generating rows in the emoji picker.
 * This configuration determines how emojis are displayed, including their size, the number of items per row, and whether category rows should be generated.
 * @group Types
 * @typedef {Object} EmojiRowGenerationConfig
 */
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
