import { inject, Injectable } from '@angular/core';
import {
	BehaviorSubject,
	combineLatest,
	map,
	Observable,
} from 'rxjs';
import { EmojiSize } from '../../../enums';
import {
	Emoji,
	EmojiCategory,
	EmojiPickerRow,
} from '../../../models';
import { SuggestionEmojis } from '../../../models/suggestion-emojis.model';
import { EmojiDataService } from '../../../services';

@Injectable()
export class VerticalEmojiPickerService {
	private emojiDataService = inject(EmojiDataService);

	private suggestionRows$: BehaviorSubject<EmojiPickerRow[]> =
		new BehaviorSubject<EmojiPickerRow[]>([]);

	private emojiRows$: BehaviorSubject<EmojiPickerRow[]> =
		new BehaviorSubject<EmojiPickerRow[]>([]);

	finalRows$: Observable<EmojiPickerRow[]> = combineLatest([
		this.suggestionRows$,
		this.emojiRows$,
	]).pipe(
		map(([suggestionRows, emojiRows]) => [
			...suggestionRows,
			...emojiRows,
		])
	);

	updateSuggestionRows = (
		emojis: SuggestionEmojis | null,
		emojiCategories: EmojiCategory[],
		emojiSize: number,
		viewportWidth: number,
		itemSizeMultiplier: number
	): void => {
		const emojiRows = !!emojis
			? this.generateSuggestionRows(
					emojiCategories,
					emojis,
					emojiSize,
					viewportWidth,
					itemSizeMultiplier
			  )
			: [];

		this.suggestionRows$.next(emojiRows);
	};

	updateEmojiRows = (
		emojis: Emoji[],
		emojiSize: number,
		viewportWidth: number,
		itemSizeMultiplier: number
	): void => {
		const emojiRows = this.generateEmojiRows(
			emojis,
			emojiSize,
			viewportWidth,
			itemSizeMultiplier
		);
		this.emojiRows$.next(emojiRows);
	};

	generateSuggestionRows = (
		categories: EmojiCategory[],
		suggestionEmojis: SuggestionEmojis,
		emojiSize: number,
		viewportWidth: number,
		itemSizeMultiplier: number
	): EmojiPickerRow[] => {
		if (!categories.includes('suggestions')) return [];
		const maxEmojisPerRow = this.calculateAmountEmojiInRows(
			emojiSize,
			viewportWidth,
			itemSizeMultiplier
		);

		const rows: EmojiPickerRow[] = [
			{
				id: crypto.randomUUID(),
				type: 'category',
				value: 'suggestions',
				translationKey: suggestionEmojis.suggestionMode,
			},
		];

		for (
			let i = 0;
			i < suggestionEmojis.emojis.length;
			i += maxEmojisPerRow
		) {
			const chunk = suggestionEmojis.emojis.slice(
				i,
				i + maxEmojisPerRow
			);
			rows.push({
				id: crypto.randomUUID(),
				type: 'emoji',
				value: chunk,
			});
		}

		return rows;
	};

	generateEmojiRows = (
		emojis: Emoji[],
		emojiSize: number,
		viewportWidth: number,
		itemSizeMultiplier: number
	): EmojiPickerRow[] => {
		const maxEmojisPerRow = this.calculateAmountEmojiInRows(
			emojiSize,
			viewportWidth,
			itemSizeMultiplier
		);
		const rows: EmojiPickerRow[] = [];
		let currentRow: Emoji[] = [];

		emojis.forEach((emoji, index) => {
			const previousEmoji = emojis[index - 1];
			const nextEmoji = emojis[index + 1];

			// Add emoji to row
			currentRow.push(emoji);

			// Check if we need to add a category row
			if (
				!previousEmoji ||
				emoji.category !== previousEmoji.category
			) {
				rows.push({
					id: crypto.randomUUID(),
					type: 'category',
					value: emoji.category,
					translationKey: emoji.category,
				});
			}

			// Check if the current row is full or if it's the last emoji in the category
			if (
				currentRow.length === maxEmojisPerRow ||
				!nextEmoji ||
				(nextEmoji && nextEmoji.category !== emoji.category)
			) {
				rows.push({
					id: crypto.randomUUID(),
					type: 'emoji',
					value: currentRow,
				});
				currentRow = [];
			}
		});
		return rows;
	};

	calculateEmojiSize = (
		viewportWidth: number,
		emojiSize: EmojiSize,
		itemSizeMultiplier: number
	): number => {
		const idealEmojiSize = emojiSize;
		const maxEmojisPerRow = this.calculateAmountEmojiInRows(
			idealEmojiSize,
			viewportWidth,
			itemSizeMultiplier
		);

		return this.toFixedAndFloor(
			viewportWidth / (maxEmojisPerRow * itemSizeMultiplier),
			2
		);
	};

	private toFixedAndFloor = (
		value: number,
		decimals: number
	): number => {
		const multiplier = Math.pow(10, decimals);
		const flooredValue = Math.floor(value * multiplier) / multiplier;
		return Number(flooredValue.toFixed(decimals));
	};

	calculateAmountEmojiInRows = (
		emojiSize: number,
		viewportWidth: number,
		itemSizeMultiplier: number
	): number => {
		return Math.floor(
			viewportWidth / (emojiSize * itemSizeMultiplier)
		);
	};

	getEmojiById = (id: string) => {
		return this.emojiDataService.getEmojiById(id);
	};
}
