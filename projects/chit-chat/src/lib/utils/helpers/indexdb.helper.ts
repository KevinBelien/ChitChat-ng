import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IndexDbConfig } from '../interfaces';

export class IndexDbHelper {
	public static initializeIndexDb(
		config: IndexDbConfig
	): Observable<IDBDatabase> {
		return new Observable<IDBDatabase>((observer) => {
			const request = indexedDB.open(config.name, config.version);

			request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
				const db = (event.target as IDBOpenDBRequest).result;

				config.objectStores.forEach((store) => {
					if (!db.objectStoreNames.contains(store.name)) {
						const objectStore = db.createObjectStore(store.name, {
							keyPath: store.keyExpr,
						});

						store.indexes?.forEach((storeIndex) => {
							objectStore.createIndex(
								storeIndex.name,
								storeIndex.keyExpr,
								storeIndex.options
							);
						});
					}
				});
			};

			request.onsuccess = (event: Event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				observer.next(db);
				observer.complete();
			};

			request.onerror = (event: Event) => {
				const error = (event.target as IDBOpenDBRequest).error;
				observer.error(error);
			};
		}).pipe(catchError((error) => throwError(() => error)));
	}

	public static add = <T>(
		db: IDBDatabase,
		storeName: string,
		value: T & { key?: any }
	): Observable<void> => {
		return new Observable<void>((observer) => {
			const transaction = db.transaction([storeName], 'readwrite');
			const objectStore = transaction.objectStore(storeName);

			const key = value.key;
			delete value.key;

			const request: IDBRequest<IDBValidKey> = !!key
				? objectStore.add(value, key)
				: objectStore.add(value);

			request.onsuccess = () => {
				observer.next();
				observer.complete();
			};

			request.onerror = (event: Event) => {
				const error = (event.target as IDBRequest).error;
				observer.error(error);
			};
		}).pipe(
			catchError((error: any) =>
				throwError(() => {
					console.log(error);
					return error;
				})
			)
		);
	};

	public static addMultiple = <T>(
		db: IDBDatabase,
		storeName: string,
		values: Array<T & { key?: any }>
	): Observable<void[]> => {
		const addObservables = values.map((value) =>
			IndexDbHelper.add(db, storeName, value)
		);
		return forkJoin(addObservables).pipe(
			catchError((error: any) => throwError(() => error))
		);
	};

	public static queryData = <T>(
		db: IDBDatabase,
		storeName: string,
		indexName: string,
		keyword: string
	): Observable<T[]> => {
		return new Observable<T[]>((observer) => {
			const transaction = db.transaction([storeName], 'readonly');
			const objectStore = transaction.objectStore(storeName);
			const index = objectStore.index(indexName);

			const results: T[] = [];

			index.openCursor().onsuccess = (event: Event) => {
				const cursor = (event.target as IDBRequest).result;
				if (cursor) {
					if (
						(cursor.value.keywords as string[]).some((kw) =>
							kw.includes(keyword)
						)
					) {
						results.push(cursor.value);
					}
					cursor.continue();
				} else {
					observer.next(results);
					observer.complete();
				}
			};

			index.openCursor().onerror = (event: Event) => {
				const error = (event.target as IDBRequest).error;
				observer.error(error);
			};
		}).pipe(catchError((error: any) => throwError(() => error)));
	};
}
