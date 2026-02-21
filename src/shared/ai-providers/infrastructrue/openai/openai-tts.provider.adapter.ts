import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { TTSProviderPort } from '../../domain/ports/tts.provider.port';
import { InteractionResult } from 'src/shared/types/interaction';

@Injectable()
export class OpenAITTSProviderAdapter implements TTSProviderPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(input: {
		text: string;
		voice?: string;
		style?: string;
	}): Promise<InteractionResult<Buffer>> {
		const mp3Response = await this.openai.audio.speech.create({
			model: 'gpt-4o-mini-tts',
			voice: input.voice || 'cedar',
			input: input.text,
			response_format: 'mp3',
			instructions: input.style || '',
		});

		const buffer = Buffer.from(await mp3Response.arrayBuffer());

		return {
			content: buffer,
		};
	}
}
