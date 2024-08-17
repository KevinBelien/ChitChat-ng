import { computed, inject, Injectable, signal } from '@angular/core';
import { emojis } from '../data';
import { Emoji, Skintone } from '../models';
import { IndividualEmojiSkintone } from './../models/skin-tone.model';
import { SkintoneSetting } from './../models/skintone-setting.model';
import { EmojiStorageService } from './emoji-storage.service';

@Injectable({ providedIn: 'root' })
export class EmojiDataService {
	private emojiStorageService = inject(EmojiStorageService);

	recentEmojis = signal<Emoji[]>([]);

	frequentEmojis = signal<Emoji[]>([]);

	globalSkintoneSetting = signal<Skintone>('default');

	individualSkintones = signal<IndividualEmojiSkintone[]>([]);

	skintoneSetting = signal<SkintoneSetting>('none');
	emojis = signal<Emoji[]>([...emojis]);

	emojiMap = computed(
		(): Map<string, Emoji> =>
			this.generateEmojiMap(
				this.emojis(),
				this.skintoneSetting(),
				this.globalSkintoneSetting(),
				this.individualSkintones()
			)
	);

	constructor() {
		this.globalSkintoneSetting.update(() =>
			this.fetchGlobalSkintone()
		);

		this.individualSkintones.update(() =>
			this.emojiStorageService.fetchIndividualEmojisSkintones()
		);

		this.recentEmojis.update(() =>
			this.fetchRecentEmojisFromStorage()
		);

		this.frequentEmojis.update(() =>
			this.fetchFrequentEmojisFromStorage()
		);
	}

	updateEmojiSkintone = (emojiId: string, value: string) => {
		this.emojiStorageService.updateEmojiSkintone(emojiId, value);

		this.individualSkintones.set(
			this.emojiStorageService.fetchIndividualEmojisSkintones()
		);
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

	setGlobalEmojiSkintone = (skintone: Skintone) => {
		this.emojiStorageService.updateGlobalSkintone(skintone);
		this.globalSkintoneSetting.update(() => skintone);
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
