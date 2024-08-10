import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Language } from '../data';
import { LocaleTranslations, Translations } from '../models';
import { enTranslations } from '../public-api';

@Injectable({
	providedIn: 'root',
})
export class TranslationService {
	readonly currentLanguage$ = new BehaviorSubject<Language>('en');

	readonly translations$: BehaviorSubject<LocaleTranslations> =
		new BehaviorSubject<LocaleTranslations>(new Map());

	constructor() {
		this.loadTranslations('en', enTranslations);
	}

	setLanguage = (language: Language): void => {
		this.currentLanguage$.next(language);
	};

	getLanguage = (): Language => {
		return this.currentLanguage$.getValue();
	};

	loadTranslations = (
		language: Language,
		translations: { [key: string]: string }
	): void => {
		const mappedTranslations: LocaleTranslations =
			this.translations$.getValue();

		let localeTranslations = mappedTranslations.get(language);

		if (!localeTranslations) {
			localeTranslations = new Map<string, string>();
			mappedTranslations.set(language, localeTranslations);
		}

		Object.entries(translations).forEach(([key, value]) => {
			localeTranslations.set(key, value);
		});

		this.translations$.next(mappedTranslations);
	};

	unloadTranslations = (language: Language) => {
		const mappedTranslations: LocaleTranslations =
			this.translations$.getValue();

		mappedTranslations.delete(language);

		this.translations$.next(mappedTranslations);
	};

	getAllTranslations = (): LocaleTranslations => {
		return this.translations$.getValue();
	};

	getTranslationsByLanguage = (
		language: Language
	): Translations | undefined => {
		return this.getAllTranslations().get(language);
	};

	getTranslationsByCurrentLanguage = (): Translations | undefined => {
		return this.getTranslationsByLanguage(this.getLanguage());
	};

	getTranslationByKey = (key: string): string | undefined => {
		return this.getTranslationsByCurrentLanguage()?.get(key);
	};
}
