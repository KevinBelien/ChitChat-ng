import { Emoji, EmojiCategory } from '.';

export type EmojiPickerRow = { id: string } & (
	| {
			type: 'category';
			value: EmojiCategory | Emoji[];
			translationKey: string;
	  }
	| { type: 'emoji'; value: Emoji[] }
);
