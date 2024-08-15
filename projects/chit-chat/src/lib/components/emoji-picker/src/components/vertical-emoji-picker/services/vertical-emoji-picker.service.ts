import { inject, Injectable } from '@angular/core';
import { NumberHelper } from 'chit-chat/src/lib/utils';
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

	emojiDataMap = this.emojiDataService.emojiMap;

	generateFilterRows = (
		emojis: Emoji[],
		emojiSize: number,
		viewportWidth: number,
		itemSizeMultiplier: number
	) => {
		const maxEmojisPerRow = this.calculateAmountEmojiInRows(
			emojiSize,
			viewportWidth,
			itemSizeMultiplier
		);

		const rows: EmojiPickerRow[] = [
			{
				id: crypto.randomUUID(),
				type: 'category',
				value: 'search',
				translationKey: `emojipicker.category.search`,
			},
		];

		for (let i = 0; i < emojis.length; i += maxEmojisPerRow) {
			const chunk = emojis.slice(i, i + maxEmojisPerRow);
			rows.push({
				id: crypto.randomUUID(),
				type: 'emoji',
				value: chunk,
			});
		}

		return rows;
	};
	generateSuggestionRows = (
		suggestionEmojis: SuggestionEmojis,
		categories: EmojiCategory[],
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
				translationKey: `emojipicker.category.${suggestionEmojis.suggestionMode}`,
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

	generateDefaultEmojiRows = (
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
					translationKey: `emojipicker.category.${emoji.category}`,
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

		return NumberHelper.toFixedAndFloor(
			viewportWidth / (maxEmojisPerRow * itemSizeMultiplier),
			2
		);
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

	fetchEmojiById = (id: string) => {
		return this.emojiDataService.fetchEmojiById(id);
	};
}
