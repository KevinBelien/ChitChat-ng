export interface MapResult<T> {
	data: T | null;
	error?: Error;
}

export interface MapResultCollection<T, P> {
	data: Array<P>;
	errors: Array<MapResult<T>>;
}
