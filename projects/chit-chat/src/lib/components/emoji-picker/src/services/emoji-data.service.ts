// emoji-data.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import {
	IndexDbConfig,
	IndexDbHelper,
} from 'chit-chat/src/lib/utils';
import {
	BehaviorSubject,
	from,
	Observable,
	Subject,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs';
import { Emoji } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class EmojiDataService implements OnDestroy {
	private db: IDBDatabase | null = null;
	private dbConfig: IndexDbConfig = {
		name: 'emojis-chitchat',
		version: 1,
		objectStores: [
			{
				name: 'emojis',
				keyExpr: 'id',
				indexes: [
					{
						name: 'category',
						keyExpr: 'category',
						options: { unique: false },
					},
					{
						name: 'category_order',
						keyExpr: ['category', 'order'],
						options: { unique: false },
					},

					{
						name: 'keywords',
						keyExpr: 'keywords',
						options: { unique: false, multiEntry: true },
					},
				],
			},
		],
	};

	private emojiMap$ = new BehaviorSubject<Map<string, Emoji>>(
		new Map()
	);

	dbInitialized = new BehaviorSubject<boolean>(false);

	private destroy$ = new Subject<void>();

	constructor() {
		this.initializeEmojiStore()
			.pipe(
				tap((db) => {
					this.db = db;
					this.dbInitialized.next(true);
				}),
				switchMap((db) => this.loadEmojisIntoMap(db)),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: () => {
					console.log('Emojis loaded into map');
				},
				error: (error) => {
					throw new Error('Emoji store initialization error');
				},
			});
	}

	private initializeEmojiStore = (): Observable<IDBDatabase> => {
		return IndexDbHelper.initializeIndexDb(this.dbConfig).pipe(
			switchMap((db: IDBDatabase) =>
				this.checkAndAddDefaultEmojis(db).pipe(
					switchMap(() => from([db]))
				)
			)
		);
	};

	private checkAndAddDefaultEmojis = (
		db: IDBDatabase
	): Observable<void> => {
		return new Observable<void>((observer) => {
			const transaction = db.transaction(['emojis'], 'readonly');
			const objectStore = transaction.objectStore('emojis');
			const countRequest = objectStore.count();

			countRequest.onsuccess = () => {
				if (countRequest.result === 0) {
					from(import('../data/emojis'))
						.pipe(
							switchMap((module) => {
								const { emojis } = module;
								return IndexDbHelper.addMultiple<Emoji>(
									db,
									'emojis',
									emojis
								);
							})
						)
						.subscribe({
							next: () => {
								observer.next();
								observer.complete();
							},
							error: (addError) => observer.error(addError),
						});
				} else {
					observer.next();
					observer.complete();
				}
			};

			countRequest.onerror = (event) => {
				const error = (event.target as IDBRequest).error;
				observer.error(error);
			};
		});
	};

	fetchEmojis = (
		includedCategories: string[]
	): Observable<Emoji[]> => {
		if (!this.db) {
			return new Observable<Emoji[]>((observer) => {
				observer.error('Database is not initialized');
			});
		}

		return new Observable<Emoji[]>((observer) => {
			const transaction = this.db!.transaction(
				['emojis'],
				'readonly'
			);
			const objectStore = transaction.objectStore('emojis');
			const emojis: Emoji[] = [];

			const fetchCategoryEmojis = (
				category: string,
				callback: () => void
			) => {
				const index = objectStore.index('category_order'); // Use the compound index
				const request = index.openCursor(
					IDBKeyRange.bound([category], [category, []]),
					'next'
				);

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest).result;
					if (cursor) {
						emojis.push(cursor.value);
						cursor.continue();
					} else {
						callback();
					}
				};

				request.onerror = (event) => {
					const error = (event.target as IDBRequest).error;
					observer.error(error);
				};
			};

			const fetchNextCategory = (index: number) => {
				if (index < includedCategories.length) {
					fetchCategoryEmojis(includedCategories[index], () => {
						fetchNextCategory(index + 1);
					});
				} else {
					observer.next(emojis);
					observer.complete();
				}
			};

			fetchNextCategory(0);
		});
	};

	private loadEmojisIntoMap = (db: IDBDatabase): Observable<void> => {
		return new Observable<void>((observer) => {
			const transaction = db.transaction(['emojis'], 'readonly');
			const objectStore = transaction.objectStore('emojis');

			const request = objectStore.openCursor();
			const emojiMap = new Map<string, Emoji>();

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result;
				if (cursor) {
					emojiMap.set(cursor.value.id, cursor.value);
					cursor.continue();
				} else {
					this.emojiMap$.next(emojiMap);
					observer.next();
					observer.complete();
				}
			};

			request.onerror = (event) => {
				const error = (event.target as IDBRequest).error;
				observer.error(error);
			};
		}).pipe(
			tap(() => {
				console.log('Emoji map preloaded:', this.emojiMap$.value);
			})
		);
	};

	getEmojiById = (id: string): Emoji | undefined => {
		return this.emojiMap$.value.get(id);
	};

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
