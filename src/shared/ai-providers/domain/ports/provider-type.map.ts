import { ImageProviderPort } from './image.provider.port';
import { LLMProviderPort } from './llm.provider.port';
import { TTSProviderPort } from './tts.provider.port';

export interface ProviderTypeMap {
	llm: LLMProviderPort;
	image: ImageProviderPort;
	tts: TTSProviderPort;
}
