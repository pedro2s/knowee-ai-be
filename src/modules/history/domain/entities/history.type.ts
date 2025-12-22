import { HistoryMessage } from '../value-objects/history-message.vo';

export interface HistoryProps {
	id: string;
	userId: string;
	courseId: string;
	message: HistoryMessage;
	createdAt: Date;
}

export interface CreateHistoryInput {
	userId: string;
	courseId: string;
	message: unknown;
}
