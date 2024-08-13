import { Injectable } from '@angular/core';
import { Language } from 'chit-chat/src/lib/localization';
import { ArrayMap, ObjectHelper } from 'chit-chat/src/lib/utils';

@Injectable({ providedIn: 'root' })
export class EmojiFilterService {
	filter = async (
		searchValue: string,
		language: Language
	): Promise<string[]> => {
		const translatedKeywords = await this.getTranslations(language);
		const normalizedSearchValue = searchValue.trim().toLowerCase();

		const scoredResults = [];

		for (const key in translatedKeywords) {
			const keywords = translatedKeywords[key];
			let bestScore = 0;

			for (let i = 0; i < keywords.length; i++) {
				const score = this.getMatchScore(
					keywords[i],
					normalizedSearchValue
				);

				if (score === Infinity) {
					bestScore = score;
					break; // Early exit if exact match is found
				} else if (score > bestScore) {
					bestScore = score;
				}
			}

			if (bestScore > 0) {
				scoredResults.push({ key, score: bestScore });
			}
		}

		scoredResults.sort((a, b) => b.score - a.score);

		return scoredResults.map((result) => result.key);
	};

	private getMatchScore(
		keyword: string,
		searchValue: string
	): number {
		if (keyword === searchValue) {
			console.log(keyword, searchValue);
			return Infinity; // Exact match gets the highest possible score
		}

		if (keyword.startsWith(searchValue)) {
			return 1 / (keyword.length - searchValue.length + 1); // Shorter matches get higher scores
		}

		return 0; // No match
	}

	private getTranslations = async (
		language: Language
	): Promise<ArrayMap<string>> => {
		try {
			const filename = this.getTranslationFilename(language);
			const module = await import('../locales');
			const defaultTranslations = module.enKeywordTranslations;
			const localeTranslations = filename ? module[filename] : null;

			return !!localeTranslations
				? ObjectHelper.combineArrayMap(
						localeTranslations,
						defaultTranslations
				  )
				: defaultTranslations;
		} catch (error: any) {
			throw new Error(
				`Error loading translation module: ${error.message}`
			);
		}
	};

	getTranslationFilename = (
		language: Language
	): TranslationFilename | null => {
		switch (language) {
			case 'nl':
				return 'nlKeywordTranslations';
			case 'de':
				return 'deKeywordTranslations';
			default:
				return null;
		}
	};
}

type TranslationFilename =
	| 'nlKeywordTranslations'
	| 'deKeywordTranslations';
