import { InteractionResult } from '../../../types/interaction';

export interface ImageProviderPort {
	generate(input: {
		prompt: string;
		size: '1024x1024' | '1536x1024' | '1024x1536';
	}): Promise<InteractionResult<Buffer>>;
}
