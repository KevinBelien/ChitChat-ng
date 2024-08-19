import { inject, Injectable, signal } from '@angular/core';
import { EmojiSize } from '../enums';
import { EmojiRowGenerator } from '../helpers';
import { Emoji, EmojiPickerRow, SuggestionEmojis } from '../models';
import { EmojiDataService } from './emoji-data.service';

export type EmojiRowGenerationConfig = {
	emojiSize: number;
	viewportWidth: number;
	itemSizeMultiplier: number;
	generateCategoryRows: boolean;
} & (
	| {
			type: 'suggestions';
			emojis: SuggestionEmojis;
	  }
	| {
			type: 'filter' | 'default';
			emojis: Emoji[];
	  }
);

@Injectable({ providedIn: 'root' })
export class EmojiPickerService {
	private dataService = inject(EmojiDataService);

	emojiDataMap = this.dataService.emojiMap;

	emojiItemSizeMultiplier = signal<number>(1.5);

	padding = signal<number>(6);

	setEmojiContainerSizeMultiplier = (value: number) => {
		this.emojiItemSizeMultiplier.set(value);
	};

	setPadding = (value: number) => {
		this.padding.set(value);
	};

	generateEmojiRows = ({
		emojiSize,
		viewportWidth,
		itemSizeMultiplier,
		generateCategoryRows,
		type,
		emojis,
	}: EmojiRowGenerationConfig) => {
		const emojisPerRow = this.calculateEmojisPerRow(
			emojiSize,
			viewportWidth,
			itemSizeMultiplier
		);

		switch (type) {
			case 'suggestions':
				return this.generateSuggestionRows(
					emojis,
					emojisPerRow,
					generateCategoryRows
				);
			case 'filter':
				return this.generateFilterRows(
					emojis,
					emojisPerRow,
					generateCategoryRows
				);
			default:
				return this.generateDefaultEmojiRows(
					emojis,
					emojisPerRow,
					generateCategoryRows
				);
		}
	};

	generateFilterRows = (
		emojis: Emoji[],
		emojisPerRow: number,
		generateCategoryRows: boolean = true
	) => {
		const generator = new EmojiRowGenerator({
			emojisPerRow,
			generateCategoryRows,
		});
		return generator.generateEmojiRowsPerCategory(
			{
				category: 'search',
			},
			emojis
		);
	};
	generateSuggestionRows = (
		suggestionEmojis: SuggestionEmojis,
		emojisPerRow: number,
		generateCategoryRows: boolean = true
	): EmojiPickerRow[] => {
		const generator = new EmojiRowGenerator({
			emojisPerRow,
			generateCategoryRows,
		});
		return generator.generateEmojiRowsPerCategory(
			{
				category: 'suggestions',
				translationKey: `emojipicker.category.${suggestionEmojis.suggestionMode}`,
			},
			suggestionEmojis.emojis
		);
	};

	generateDefaultEmojiRows = (
		emojis: Emoji[],
		emojisPerRow: number,
		generateCategoryRows: boolean = true
	): EmojiPickerRow[] => {
		const generator = new EmojiRowGenerator({
			emojisPerRow,
			generateCategoryRows,
		});
		return generator.generateEmojiRows(emojis);
	};

	calculateEmojiSize = (
		viewportSize: number,
		emojiSize: EmojiSize,
		itemSizeMultiplier: number
	): number => {
		const idealEmojiSize = emojiSize;
		const maxEmojisPerRow = this.calculateEmojisPerRow(
			idealEmojiSize,
			viewportSize,
			itemSizeMultiplier
		);

		return viewportSize / (maxEmojisPerRow * itemSizeMultiplier);
	};

	calculateEmojisPerRow = (
		emojiSize: number,
		viewportSize: number,
		itemSizeMultiplier: number
	): number => {
		return Math.floor(
			viewportSize / (emojiSize * itemSizeMultiplier)
		);
	};
}
