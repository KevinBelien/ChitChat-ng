import { MessageContent } from '../types/message-content.type';

export interface DtoMessage {
	isGroupMessage: boolean;
	groupId?: string;
	senderId: string;
	recipientId: string;
	message: MessageContent;
	participants: Array<string>;
	isSeen: boolean;
	seenAt?: number | null;
	sendAt: number;
	isEdited: boolean;
	isDeleted: boolean;
}
