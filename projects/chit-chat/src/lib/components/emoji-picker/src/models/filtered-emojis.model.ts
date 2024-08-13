import { Emoji } from './emoji.model';

export interface FilteredEmojis {
	filterActive: boolean;
	emojis: Emoji[];
}
