import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EmojiPickerStateService {
	emojiItemSizeMultiplier = signal<number>(1.5);

	padding = signal<number>(6);

	setEmojiContainerSizeMultiplier = (value: number) => {
		this.emojiItemSizeMultiplier.set(value);
	};

	setPadding = (value: number) => {
		this.padding.set(value);
	};
}
