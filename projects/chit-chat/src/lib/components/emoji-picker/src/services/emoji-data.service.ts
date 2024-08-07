import { inject, Injectable, OnDestroy } from '@angular/core';
import {
	BehaviorSubject,
	combineLatest,
	Subject,
	takeUntil,
} from 'rxjs';
import { emojis } from '../data';
import {
	Emoji,
	emojiCategories,
	EmojiCategory,
	IndividualEmojiSkintone,
	Skintone,
	SkintoneSetting,
} from '../models';
import { EmojiStorageService } from './emoji-storage.service';

@Injectable({ providedIn: 'root' })
export class EmojiDataService implements OnDestroy {
	private emojiStorageService = inject(EmojiStorageService);

	readonly emojis$: BehaviorSubject<Emoji[]> = new BehaviorSubject<
		Emoji[]
	>([...emojis]);

	readonly recentEmojis$: BehaviorSubject<Emoji[]>;
	readonly frequentEmojis$: BehaviorSubject<Emoji[]>;

	readonly emojiCategories$: BehaviorSubject<EmojiCategory[]> =
		new BehaviorSubject<EmojiCategory[]>([...emojiCategories]);

	readonly emojiMap$: BehaviorSubject<Map<string, Emoji>>;

	readonly skintoneSetting$ = new BehaviorSubject<SkintoneSetting>(
		'none'
	);
	readonly globalSkintoneSetting$: BehaviorSubject<Skintone>;

	destroy$ = new Subject<void>();

	constructor() {
		this.emojiMap$ = new BehaviorSubject<Map<string, Emoji>>(
			this.createEmojiMap()
		);

		this.recentEmojis$ = new BehaviorSubject<Emoji[]>(
			this.fetchRecentEmojisFromStorage()
		);

		this.frequentEmojis$ = new BehaviorSubject<Emoji[]>(
			this.fetchFrequentEmojisFromStorage()
		);

		this.emojiCategories$
			.pipe(takeUntil(this.destroy$))
			.subscribe((categories) => {
				this.emojis$.next(
					this.filterAndSortEmojis(
						categories.filter(
							(category) => category !== 'suggestions'
						)
					)
				);
			});

		this.globalSkintoneSetting$ = new BehaviorSubject<Skintone>(
			this.fetchGlobalSkintone()
		);

		combineLatest([
			this.skintoneSetting$,
			this.globalSkintoneSetting$,
		])
			.pipe(takeUntil(this.destroy$))
			.subscribe(([skintoneSetting, globalSkintone]) => {
				this.applySkintoneSetting(skintoneSetting);
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	setSkintoneSetting = (value: SkintoneSetting) => {
		this.skintoneSetting$.next(value);
	};

	applySkintoneSetting = (skintoneConfig: SkintoneSetting) => {
		switch (skintoneConfig) {
			case 'none':
				this.applyUniformSkintone('default');
				break;
			case 'individual':
				this.applyIndividualSkintoneSetting();
				break;
			default:
				this.applyGlobalSkintoneSetting();
				break;
		}
	};

	updateGlobalSkintone = (skintone: Skintone) => {
		this.emojiStorageService.updateGlobalSkintone(skintone);
		this.globalSkintoneSetting$.next(skintone);
	};

	applyGlobalSkintoneSetting = (): void => {
		const globalSkintone = this.fetchGlobalSkintone();

		this.applyUniformSkintone(globalSkintone);
	};

	applyIndividualSkintoneSetting = () => {
		const response: IndividualEmojiSkintone[] =
			this.emojiStorageService.fetchEmojisSkintone();

		const emojiMap = this.emojiMap$.getValue();

		for (const record of response) {
			const emoji = emojiMap.get(record.emojiId);

			if (!emoji) break;

			const newEmoji = {
				...emoji,
				value: record.emojiValue,
			};

			emojiMap.set(record.emojiId, newEmoji);
		}
		this.emojiMap$.next(emojiMap);
	};

	updateEmojiSkintone = (emojiId: string, value: string) => {
		this.emojiStorageService.updateEmojiSkintone(emojiId, value);

		const map = this.emojiMap$.getValue();
		const previousValue = this.fetchEmojiById(emojiId);

		if (!previousValue) return;

		map.set(emojiId, Object.assign({ ...previousValue }, { value }));

		this.emojiMap$.next(map);
	};

	applyUniformSkintone = (skintone: Skintone): void => {
		const emojiMap = this.emojiMap$.getValue();
		emojiMap.forEach((emoji: Emoji) => {
			if (!!emoji.skintones) {
				const newEmoji = Object.assign(
					{ ...emoji },
					{ value: this.fetchSkintoneFromEmoji(emoji, skintone) }
				);
				emojiMap.set(emoji.id, newEmoji);
			}
		});

		this.emojiMap$.next(emojiMap);
	};

	fetchGlobalSkintone = () => {
		return this.emojiStorageService.fetchGlobalSkintone();
	};

	fetchSkintoneFromEmoji = (
		emoji: Emoji,
		skintone: Skintone
	): string => {
		if (!emoji.skintones) {
			return emoji.value;
		}
		const skintoneObj = emoji.skintones.find(
			(s) => s.skintone === skintone
		);

		return skintoneObj ? skintoneObj.value : emoji.value;
	};

	fetchEmojiById = (id: string): Emoji | undefined => {
		return this.emojiMap$.getValue().get(id);
	};

	fetchEmojisByIds = (emojiIds: string[]): Emoji[] => {
		return emojiIds
			.map((id) => this.fetchEmojiById(id))
			.filter((emoji) => !!emoji);
	};

	filterEmojisByCategories = (
		emojis: Emoji[],
		includedCategories: EmojiCategory[]
	): Emoji[] => {
		return emojis.filter((emoji) =>
			includedCategories.includes(emoji.category)
		);
	};

	filterAndSortEmojis = (categories: EmojiCategory[]): Emoji[] => {
		const filteredEmojis = this.filterEmojisByCategories(
			[...emojis],
			categories
		);
		return this.sortEmojis(filteredEmojis, categories);
	};

	sortEmojis = (
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
		return this.emojis$.getValue();
	};

	createEmojiMap = (): Map<string, Emoji> => {
		const emojis = this.getEmojis();
		return new Map(emojis.map((emoji) => [emoji.id, emoji]));
	};

	setEmojiCategories = (categories: EmojiCategory[]): void => {
		this.emojiCategories$.next(
			categories.sort((a, b) => {
				if (a === 'suggestions') return -1;
				if (b === 'suggestions') return 1;
				return 0;
			})
		);
	};

	hasEmojiSkintones = (emoji: Emoji) => {
		return !!emoji.skintones && emoji.skintones.length > 0;
	};

	fetchRecentEmojisFromStorage = (): Emoji[] => {
		const emojiIds =
			this.emojiStorageService.retrieveFromStorage<string>('recent');

		const emojis = this.fetchEmojisByIds(emojiIds).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		return emojis;
	};

	fetchFrequentEmojisFromStorage = (): Emoji[] => {
		const frequentEmojis =
			this.emojiStorageService.fetchFrequentEmojis();

		const emojis = this.fetchEmojisByIds(
			frequentEmojis.map((frequentEmoji) => frequentEmoji.id)
		).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);
		return emojis;
	};

	addEmojiToRecents = (id: string): void => {
		const emojiIds =
			this.emojiStorageService.prependToStorage<string>('recent', id);
		const emojis = this.fetchEmojisByIds(emojiIds).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		this.recentEmojis$.next(emojis);
	};

	increaseEmojiFrequency = (id: string): void => {
		const frequentEmojis =
			this.emojiStorageService.increaseEmojiFrequency(id);

		const emojis = this.fetchEmojisByIds(
			frequentEmojis.map((frequentEmoji) => frequentEmoji.id)
		).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		this.frequentEmojis$.next(emojis);
	};
}
