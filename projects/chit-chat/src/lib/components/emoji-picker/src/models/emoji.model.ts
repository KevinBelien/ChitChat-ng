import { EmojiCategory } from './emoji-category.model';
import { AlternativeSkinTone } from './skin-tone.model';

export interface Emoji {
	id: string;
	name: string;
	value: string;
	category: EmojiCategory;
	order: number;
	skinTones?: AlternativeSkinTone[];
	keywords: string[];
}
