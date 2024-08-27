/**
 * Represents an alternative skintone variation for an emoji.
 *
 * @group Interfaces
 */
export interface AlternativeSkintone {
	skintone: Skintone;
	value: string;
	order: number;
}

/**
 * A list of supported skintones for emojis.
 *
 * @group Constants
 * @constant {ReadonlyArray<string>}
 */
export const skintones = [
	'default',
	'light',
	'medium-light',
	'medium',
	'medium-dark',
	'dark',
] as const;

/**
 * Represents a skintone type derived from the supported skintones.
 *
 * @group Types
 */
export type Skintone = (typeof skintones)[number];

/**
 * Represents a specific skintone variation applied to an individual emoji.
 *
 * @group Interfaces
 */
export interface IndividualEmojiSkintone {
	emojiId: string;
	emojiValue: string;
}

/**
 * Checks if a given value is a valid skintone.
 *
 * @param {string} value - The value to check.
 * @returns {boolean} True if the value is a valid skintone, otherwise false.
 *
 * @group Functions
 */
export const isValidSkintone = (value: string): value is Skintone => {
	return skintones.includes(value as Skintone);
};
