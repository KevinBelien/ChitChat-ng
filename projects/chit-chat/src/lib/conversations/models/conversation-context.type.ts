import { User } from '@chit-chat/ng-chat/src/lib/users';

export type ConversationContext =
	| { participantIds: string[]; isGroup: true; group: any }
	| { participantIds: string[]; isGroup: false; user: User };
