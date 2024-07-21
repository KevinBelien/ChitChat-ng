export interface MapResult<T, P> {
	data: P | null;
	error?: Error;
}

export interface MapResultCollection<T, P> {
	data: Array<P>;
	errors: Array<MapResult<T, P>>;
}
