export interface MapResult<T> {
	data: T | null;
	error?: Error;
}

export interface MapResultCollection<P> {
	data: Array<P>;
	errors: Array<MapResult<P>>;
}
