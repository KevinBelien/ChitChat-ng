import { groupedEmojis } from '.';
import { Emoji } from '../interfaces';

export const emojis: Emoji[] = [...groupedEmojis].flatMap(
	(group) => group.emojis
);

export const mappedEmojis: Map<string, Emoji> = new Map(
	emojis.map((emoji) => [emoji.name, emoji])
);
