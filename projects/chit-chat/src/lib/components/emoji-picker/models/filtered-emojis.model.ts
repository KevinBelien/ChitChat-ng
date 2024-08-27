import { Emoji } from './emoji.model';

/**
 * Represents the state and results of an emoji filtering operation.
 * @group Interfaces
 */
export interface FilteredEmojis {
	filterActive: boolean;
	emojis: Emoji[];
}
