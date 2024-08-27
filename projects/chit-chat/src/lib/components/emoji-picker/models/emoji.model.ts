import { EmojiCategory } from './emoji-category.model';
import { AlternativeSkintone } from './skin-tone.model';

/**
 * Representing an emoji object.
 * @group Interfaces
 * @interface Emoji
 */
export interface Emoji {
	id: string;
	name: string;
	value: string;
	category: EmojiCategory;
	order: number;
	skintones?: AlternativeSkintone[];
	keywords: string[];
}
