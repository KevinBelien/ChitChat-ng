import { Emoji, EmojiCategory } from '.';

export type EmojiPickerRow = { id: string } & (
	| {
			type: 'category';
			value: EmojiCategory | Emoji[] | 'search';
			translationKey: string;
	  }
	| { type: 'emoji'; value: Emoji[] }
);
