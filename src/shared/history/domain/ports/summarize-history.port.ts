import { InteractionResult } from 'src/shared/types/interaction';

export interface SummarizeHistoryPort {
	summarize(text: string): Promise<InteractionResult<string>>;
}
