import { InteractionResult } from '../../../types/interaction';

export interface TTSProviderPort {
	generate(input: {
		text: string;
		voice?: string;
		style?: string;
	}): Promise<InteractionResult<Buffer>>;
}
