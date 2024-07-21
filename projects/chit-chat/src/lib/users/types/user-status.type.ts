export const userStatuses = [
	'offline',
	'available',
	'away',
	'do-not-disturb',
	'show-offline',
] as const;

export type UserStatus = (typeof userStatuses)[number];
