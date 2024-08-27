/**
 * Represents a frequently used emoji, including usage count and last usage timestamp.
 * @group Interfaces
 */
export interface FrequentEmoji {
	id: string;
	count: number;
	dateInMs: number;
}
