import { Injectable } from '@angular/core';
import { NumberHelper } from 'chit-chat/src/lib/utils';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmojiPickerStateService {
	emojiSizeInPx$ = new BehaviorSubject<number>(24);
	emojiItemSizeMultiplier$ = new BehaviorSubject<number>(1.5);

	emojiItemSize$ = combineLatest([
		this.emojiSizeInPx$,
		this.emojiItemSizeMultiplier$,
	]).pipe(
		map(([size, multiplier]) =>
			NumberHelper.toFixedAndFloor(size * multiplier, 0)
		)
	);

	padding$ = new BehaviorSubject<number>(6);

	setEmojiSize = (sizeInPx: number) => {
		this.emojiSizeInPx$.next(sizeInPx);
	};
	setEmojiContainerSizeMultiplier = (value: number) => {
		this.emojiItemSizeMultiplier$.next(value);
	};

	setPadding = (value: number) => {
		this.padding$.next(value);
	};
}
