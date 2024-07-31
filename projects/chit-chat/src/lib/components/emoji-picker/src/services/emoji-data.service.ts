import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { emojis } from '../data';
import { Emoji, emojiCategories, EmojiCategory } from '../models';
import { FrequentEmoji } from '../models/frequent-emoji.model';

@Injectable()
export class EmojiDataService implements OnDestroy {
	readonly STORAGE_CONFIG = {
		recent: { key: 'ch-recent-emojis', limit: 100 },
		frequent: { key: 'ch-emojis-frequently', limit: 100 },
	};

	readonly emojis: BehaviorSubject<Emoji[]> = new BehaviorSubject<
		Emoji[]
	>([...emojis]);

	readonly recentEmojis: BehaviorSubject<Emoji[]>;
	readonly frequentEmojis: BehaviorSubject<Emoji[]>;

	readonly emojiCategories: BehaviorSubject<EmojiCategory[]> =
		new BehaviorSubject<EmojiCategory[]>([...emojiCategories]);

	private mappedEmojis: BehaviorSubject<Map<string, Emoji>>;

	destroy$ = new Subject<void>();

	constructor() {
		this.mappedEmojis = new BehaviorSubject<Map<string, Emoji>>(
			this.mapEmojis()
		);

		this.recentEmojis = new BehaviorSubject<Emoji[]>(
			this.getRecentEmojisFromStorage()
		);

		this.frequentEmojis = new BehaviorSubject<Emoji[]>(
			this.getFrequentEmojisFromStorage()
		);

		this.emojiCategories
			.pipe(takeUntil(this.destroy$))
			.subscribe((categories) => {
				this.emojis.next(
					this.filterAndSortEmojisByCategoryList(
						categories.filter(
							(category) => category !== 'suggestions'
						)
					)
				);
			});
	}

	getEmojiById = (id: string): Emoji | undefined => {
		return this.mappedEmojis.getValue().get(id);
	};

	getEmojisByIds = (emojiIds: string[]): Emoji[] => {
		return emojiIds
			.map((id) => this.getEmojiById(id))
			.filter((emoji) => !!emoji);
	};

	filterEmojisByIncludedCategories = (
		emojis: Emoji[],
		includedCategories: EmojiCategory[]
	): Emoji[] => {
		return emojis.filter((emoji) =>
			includedCategories.includes(emoji.category)
		);
	};

	filterAndSortEmojisByCategoryList = (
		categories: EmojiCategory[]
	): Emoji[] => {
		const filteredEmojis = this.filterEmojisByIncludedCategories(
			[...emojis],
			categories
		);
		return this.sortEmojisByCategories(filteredEmojis, categories);
	};

	sortEmojisByCategories = (
		emojis: Emoji[],
		categories: EmojiCategory[]
	): Emoji[] => {
		return emojis.sort((a, b) => {
			const categoryComparison =
				categories.indexOf(a.category) -
				categories.indexOf(b.category);
			if (categoryComparison !== 0) {
				return categoryComparison;
			}
			return a.order - b.order;
		});
	};

	getEmojis = (): Emoji[] => {
		return this.emojis.getValue();
	};

	mapEmojis = (): Map<string, Emoji> => {
		const emojis = this.getEmojis();
		return new Map(emojis.map((emoji) => [emoji.id, emoji]));
	};

	setEmojiCategories = (categories: EmojiCategory[]): void => {
		this.emojiCategories.next(
			categories.sort((a, b) => {
				if (a === 'suggestions') return -1;
				if (b === 'suggestions') return 1;
				return 0;
			})
		);
	};

	/*STORAGE*/
	getRecentEmojisFromStorage = (): Emoji[] => {
		const emojiIds = this.getEmojisFromStorage<string>('recent');

		const emojis = this.getEmojisByIds(emojiIds).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		return emojis;
	};

	getFrequentEmojisFromStorage = (): Emoji[] => {
		const frequentEmojis =
			this.getEmojisFromStorage<FrequentEmoji>('frequent');

		const sortedFrequentEmojiIds = this.sortFrequentEmojis(
			frequentEmojis
		).map((frequentEmoji) => frequentEmoji.id);

		const emojis = this.getEmojisByIds(sortedFrequentEmojiIds).map(
			(emoji) =>
				Object.assign({ ...emoji }, { category: 'suggestions' })
		);
		return emojis;
	};

	private sortFrequentEmojis = (
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

	addEmojiToRecents = (id: string): void => {
		const emojiIds = this.addToStartInStorage<string>('recent', id);
		const emojis = this.getEmojisByIds(emojiIds).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		this.recentEmojis.next(emojis);
	};

	incrementEmojiFrequency = (id: string): void => {
		const frequentEmojis = this.incrementEmojiFrequencyInStorage(id);

		const emojis = this.getEmojisByIds(
			frequentEmojis.map((frequentEmoji) => frequentEmoji.id)
		).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		this.frequentEmojis.next(emojis);
	};

	incrementEmojiFrequencyInStorage = (
		id: string
	): FrequentEmoji[] => {
		const config = this.STORAGE_CONFIG.frequent;
		const dateInMs = Date.now();

		let frequentEmojis =
			this.getEmojisFromStorage<FrequentEmoji>('frequent');

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

		localStorage.setItem(
			this.STORAGE_CONFIG.frequent.key,
			JSON.stringify(frequentEmojis)
		);

		frequentEmojis = this.sortFrequentEmojis(frequentEmojis);

		return frequentEmojis;
	};

	getEmojisFromStorage = <T>(
		storageKey: keyof typeof this.STORAGE_CONFIG
	): Array<T> => {
		const response = localStorage.getItem(
			this.STORAGE_CONFIG[storageKey].key
		);

		return !!response ? (JSON.parse(response) as T[]) : [];
	};

	addToStartInStorage = <T>(
		storageKey: keyof typeof this.STORAGE_CONFIG,
		data: T
	): T[] => {
		const config = this.STORAGE_CONFIG[storageKey];

		let emojis = this.getEmojisFromStorage<T>(storageKey);
		emojis.unshift(data);
		emojis = [...new Set(emojis)];
		if (emojis.length > config.limit) {
			emojis = emojis.slice(0, config.limit);
		}
		localStorage.setItem(config.key, JSON.stringify(emojis));

		return emojis;
	};

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
