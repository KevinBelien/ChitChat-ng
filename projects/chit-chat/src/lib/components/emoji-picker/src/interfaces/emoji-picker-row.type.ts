import { Emoji, EmojiCategory } from '.';

export type EmojiPickerRow = { id: string } & (
	| {
			type: 'category';
			value: EmojiCategory | Emoji[];
	  }
	| { type: 'emoji'; value: Emoji[] }
);
