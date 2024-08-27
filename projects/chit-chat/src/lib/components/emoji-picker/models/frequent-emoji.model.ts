/**
 * Represents a frequently used emoji, including usage count and last usage timestamp.
 * @group Interfaces
 * @interface FrequentEmoji
 */
export interface FrequentEmoji {
	id: string;
	count: number;
	dateInMs: number;
}
