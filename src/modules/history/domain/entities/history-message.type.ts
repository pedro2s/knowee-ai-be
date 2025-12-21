export type HistoryMessage = {
	role: 'user' | 'assistant' | 'system';
	content: string;
};
