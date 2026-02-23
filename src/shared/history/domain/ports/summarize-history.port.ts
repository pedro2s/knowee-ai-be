export interface SummarizeHistoryPort {
	summarize(text: string): Promise<string>;
}
