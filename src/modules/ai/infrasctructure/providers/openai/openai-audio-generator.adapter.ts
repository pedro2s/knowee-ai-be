import { Injectable } from '@nestjs/common';
import { AudioGeneratorPort } from 'src/modules/ai/domain/ports/audio-generator.port';
import { ImageGeneratorPort } from 'src/modules/ai/domain/ports/image-generator.port';

@Injectable()
export class OpenAIAudioGeneratorAdapter implements AudioGeneratorPort {
	generate(input: { text: string; voice?: string }): Promise<Buffer> {
		throw new Error('Method not implemented.');
	}
}
