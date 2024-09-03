export type MessageContent = {
	isForwarded?: boolean;
	replyId?: string | null;
	text?: string | null;
	mediaId?: string | null;
};
