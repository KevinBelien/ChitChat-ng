import { Injectable } from '@angular/core';
import {
	FrequentEmoji,
	IndividualEmojiSkintone,
	Skintone,
	skintones,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EmojiStorageService {
	readonly STORAGE_CONFIG = {
		recent: { key: 'ch-recent-emojis', limit: 100 },
		frequent: { key: 'ch-emojis-frequently', limit: 100 },
		emojisSkintone: { key: 'ch-emojis-skintone', limit: 100 },
		globalSkintone: { key: 'ch-emojis-global-skintone' },
	} as const;

	retrieveFromStorage = <T>(
		storageKey: keyof typeof this.STORAGE_CONFIG
	): T[] => {
		const response = localStorage.getItem(
			this.STORAGE_CONFIG[storageKey].key
		);

		return !!response ? (JSON.parse(response) as T[]) : [];
	};

	storeInStorage = <T>(
		storageKey: keyof typeof this.STORAGE_CONFIG,
		data: T
	) => {
		localStorage.setItem(
			this.STORAGE_CONFIG[storageKey].key,
			JSON.stringify(data)
		);
	};

	prependToStorage = <T>(
		storageKey: keyof typeof this.STORAGE_CONFIG,
		data: T
	): T[] => {
		const config = this.STORAGE_CONFIG[storageKey];

		let emojis = this.retrieveFromStorage<T>(storageKey);
		emojis.unshift(data);
		emojis = [...new Set(emojis)];
		if ('limit' in config && emojis.length > config.limit) {
			emojis = emojis.slice(0, config.limit);
		}
		localStorage.setItem(config.key, JSON.stringify(emojis));

		return emojis;
	};

	fetchFrequentEmojis = (): FrequentEmoji[] => {
		const frequentEmojis =
			this.retrieveFromStorage<FrequentEmoji>('frequent');

		return this.sortFrequentEmojis(frequentEmojis);
	};

	increaseEmojiFrequency = (id: string): FrequentEmoji[] => {
		const config = this.STORAGE_CONFIG.frequent;
		const dateInMs = Date.now();

		let frequentEmojis =
			this.retrieveFromStorage<FrequentEmoji>('frequent');

		const emojiIndex = frequentEmojis.findIndex(
			(emoji) => emoji.id === id
		);

		if (emojiIndex > -1) {
			frequentEmojis[emojiIndex].count += 1;
			frequentEmojis[emojiIndex].dateInMs = dateInMs;
		} else {
			frequentEmojis.push({ id, count: 1, dateInMs: dateInMs });
		}

		if (frequentEmojis.length > config.limit) {
			frequentEmojis = this.sortFrequentEmojis(frequentEmojis, true);
			frequentEmojis = frequentEmojis.slice(0, config.limit);
		}

		this.storeInStorage<FrequentEmoji[]>('frequent', frequentEmojis);

		frequentEmojis = this.sortFrequentEmojis(frequentEmojis);

		return frequentEmojis;
	};

	sortFrequentEmojis = (
		emojis: FrequentEmoji[],
		sortDateDescending: boolean = false
	) => {
		return emojis.sort((a, b) => {
			if (b.count !== a.count) {
				return b.count - a.count;
			}
			return sortDateDescending
				? b.dateInMs - a.dateInMs
				: a.dateInMs - b.dateInMs;
		});
	};

	fetchIndividualEmojisSkintones = (): IndividualEmojiSkintone[] => {
		return this.retrieveFromStorage<IndividualEmojiSkintone>(
			'emojisSkintone'
		);
	};

	updateEmojiSkintone = (
		emojiId: string,
		emojiValue: string
	): IndividualEmojiSkintone[] => {
		const storageEmojiSkintones =
			this.fetchIndividualEmojisSkintones();

		const dto: IndividualEmojiSkintone = { emojiId, emojiValue };

		const index = storageEmojiSkintones.findIndex(
			(record) => record.emojiId === emojiId
		);

		if (index !== -1) {
			// If found, replace the existing record
			storageEmojiSkintones[index] = dto;
		} else {
			// If not found, add the new record
			storageEmojiSkintones.push(dto);
		}
		this.storeInStorage<IndividualEmojiSkintone[]>(
			'emojisSkintone',
			storageEmojiSkintones
		);

		return storageEmojiSkintones;
	};

	fetchGlobalSkintone = (): Skintone => {
		const response = localStorage.getItem(
			this.STORAGE_CONFIG.globalSkintone.key
		);

		return !!response && this.isValidSkintone(response)
			? response
			: 'default';
	};

	updateGlobalSkintone = (skintone: Skintone): void => {
		localStorage.setItem(
			this.STORAGE_CONFIG.globalSkintone.key,
			skintone
		);
	};

	isValidSkintone = (value: string): value is Skintone => {
		return [...skintones].includes(value as Skintone);
	};
}
