import { EmojiSuggestionMode } from './emoji-suggestion-mode.model';
import { Emoji } from './emoji.model';

export interface SuggestionEmojis {
	suggestionMode: EmojiSuggestionMode;
	emojis: Emoji[];
}
