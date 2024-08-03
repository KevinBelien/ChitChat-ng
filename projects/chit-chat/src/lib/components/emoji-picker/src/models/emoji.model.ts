import { EmojiCategory } from './emoji-category.model';
import { AlternativeSkintone } from './skin-tone.model';

export interface Emoji {
	id: string;
	name: string;
	value: string;
	category: EmojiCategory;
	order: number;
	skintones?: AlternativeSkintone[];
	keywords: string[];
}
