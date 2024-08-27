import { EmojiSuggestionMode } from './emoji-suggestion-mode.model';
import { Emoji } from './emoji.model';

/**
 * Represents a set of suggested emojis based on a specific suggestion mode.
 *
 * @group Interfaces
 */
export interface SuggestionEmojis {
	suggestionMode: EmojiSuggestionMode;
	emojis: Emoji[];
}
