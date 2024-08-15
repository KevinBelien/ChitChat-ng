import {
	computed,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal,
} from '@angular/core';
import { emojis } from '../data';
import { Emoji, EmojiCategory, Skintone } from '../models';
import { IndividualEmojiSkintone } from './../models/skin-tone.model';
import { SkintoneSetting } from './../models/skintone-setting.model';
import { EmojiStorageService } from './emoji-storage.service';

@Injectable({ providedIn: 'root' })
export class EmojiDataService {
	private emojiStorageService = inject(EmojiStorageService);

	recentEmojis: WritableSignal<Emoji[]>;

	frequentEmojis: WritableSignal<Emoji[]>;

	globalSkintoneSetting: WritableSignal<Skintone>;

	individualSkintones: WritableSignal<IndividualEmojiSkintone[]>;

	skintoneSetting = signal<SkintoneSetting>('none');
	emojis = signal<Emoji[]>([...emojis]);

	emojiMap: Signal<Map<string, Emoji>>;

	constructor() {
		this.globalSkintoneSetting = signal<Skintone>(
			this.fetchGlobalSkintone()
		);

		this.individualSkintones = signal<IndividualEmojiSkintone[]>(
			this.emojiStorageService.fetchIndividualEmojisSkintones()
		);

		this.emojiMap = computed((): Map<string, Emoji> => {
			return this.generateEmojiMap(
				this.emojis(),
				this.skintoneSetting(),
				this.globalSkintoneSetting(),
				this.individualSkintones()
			);
		});

		this.recentEmojis = signal<Emoji[]>(
			this.fetchRecentEmojisFromStorage()
		);
		this.frequentEmojis = signal<Emoji[]>(
			this.fetchFrequentEmojisFromStorage()
		);
	}

	updateEmojiSkintone = (emojiId: string, value: string) => {
		this.emojiStorageService.updateEmojiSkintone(emojiId, value);

		this.individualSkintones.set(
			this.emojiStorageService.fetchIndividualEmojisSkintones()
		);
	};

	applyGlobalSkintone = (
		emojiMap: Map<string, Emoji>,
		skintone: Skintone
	): Map<string, Emoji> => {
		emojiMap.forEach((emoji: Emoji) => {
			if (!!emoji.skintones) {
				const newEmoji = Object.assign(
					{ ...emoji },
					{ value: this.fetchSkintoneFromEmoji(emoji, skintone) }
				);
				emojiMap.set(emoji.id, newEmoji);
			}
		});

		return emojiMap;
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
		if (!this.emojiMap) return undefined;
		const emojiMap = this.emojiMap();

		return emojiMap?.get(id);
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
		return this.emojis();
	};

	generateEmojiMap = (
		emojis: Emoji[],
		skintoneSetting: SkintoneSetting,
		globalSkintoneSetting: Skintone,
		individualEmojiSkintones: IndividualEmojiSkintone[]
	): Map<string, Emoji> => {
		return new Map(
			emojis.map((emoji) => [
				emoji.id,
				this.getEmojiBySkintoneSettings(
					emoji,
					skintoneSetting,
					globalSkintoneSetting,
					individualEmojiSkintones
				),
			])
		);
	};

	getEmojiBySkintoneSettings = (
		emoji: Emoji,
		skintoneSetting: SkintoneSetting,
		globalSkintoneSetting: Skintone,
		individualEmojisSkintones: IndividualEmojiSkintone[]
	) => {
		if (
			!emoji.skintones ||
			emoji.skintones.length === 0 ||
			skintoneSetting === 'none'
		)
			return emoji;

		if (skintoneSetting === 'individual') {
			const individualEmoji = individualEmojisSkintones.find(
				(e) => e.emojiId === emoji.id
			);

			return !!individualEmoji
				? Object.assign(
						{ ...emoji },
						{ value: individualEmoji.emojiValue }
				  )
				: emoji;
		}

		const alternativeSkintone = emoji.skintones.find(
			(skintone) => skintone.skintone === globalSkintoneSetting
		);

		return Object.assign(
			{ ...emoji },
			{
				value: !!alternativeSkintone
					? alternativeSkintone.value
					: emoji.value,
			}
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

		this.recentEmojis.set(emojis);
	};

	increaseEmojiFrequency = (id: string): void => {
		const frequentEmojis =
			this.emojiStorageService.increaseEmojiFrequency(id);

		const emojis = this.fetchEmojisByIds(
			frequentEmojis.map((frequentEmoji) => frequentEmoji.id)
		).map((emoji) =>
			Object.assign({ ...emoji }, { category: 'suggestions' })
		);

		this.frequentEmojis.set(emojis);
	};

	setSkintoneSetting = (setting: SkintoneSetting) => {
		this.skintoneSetting.set(setting);
	};

	// getAllKeywords = () => {
	// 	const result: any = {};

	// 	emojis.forEach((emoji) => {
	// 		result[emoji.id] = [
	// 			emoji.keywords.map((keyword) => keyword.replaceAll('_', ' ')),
	// 			emoji.name,
	// 		].flat();
	// 	});

	// 	return result;
	// };

	// loseDuplicates = () => {
	// 	const obj: any = {};
	// 	Object.keys(deKeywordTranslations).forEach((key: string) => {
	// 		obj[key] = [
	// 			...new Set(
	// 				deKeywordTranslations[key].map((k: string) =>
	// 					k.toLowerCase()
	// 				)
	// 			),
	// 		];
	// 	});

	// 	return obj;
	// };
}
