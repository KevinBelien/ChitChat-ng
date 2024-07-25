export interface IndexDbConfig {
	name: string;
	version: number;
	objectStores: Array<ObjectStoreConfig>;
}

export interface ObjectStoreConfig {
	name: string;
	keyExpr: string;
	indexes?: ObjectStoreIndex[];
}

export interface ObjectStoreIndex {
	name: string;
	keyExpr: string | string[];
	options?: ObjectStoreIndexOptions;
}

export interface ObjectStoreIndexOptions {
	unique?: boolean;
	multiEntry?: boolean;
}
