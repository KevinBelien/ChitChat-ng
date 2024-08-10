import { Injectable } from '@angular/core';
import { Language } from 'chit-chat/src/lib/localization';
import { ArrayMap, ObjectHelper } from 'chit-chat/src/lib/utils';

@Injectable({ providedIn: 'root' })
export class EmojiFilterService {
	constructor() {}

	filter = async (
		searchValue: string,
		language: string
	): Promise<string[]> => {
		const translatedKeywords = await this.getTranslations(language);

		const normalizedSearchValue = searchValue.trim().toLowerCase();

		return Object.keys(translatedKeywords).filter((key) =>
			translatedKeywords[key].some((item) =>
				item.startsWith(normalizedSearchValue)
			)
		);
	};

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
