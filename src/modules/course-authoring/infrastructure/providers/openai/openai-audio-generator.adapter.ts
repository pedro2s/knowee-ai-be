import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AudioGeneratorPort } from 'src/modules/course-authoring/domain/ports/audio-generator.port';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';

@Injectable()
export class OpenAIAudioGeneratorAdapter implements AudioGeneratorPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(input: { text: string; voice?: string }): Promise<Buffer> {
		const mp3Response = await this.openai.audio.speech.create({
			model: 'tts-1',
			voice: input.voice || 'ash',
			input: input.text,
			response_format: 'mp3',
		});

		const buffer = Buffer.from(await mp3Response.arrayBuffer());
		return buffer;
	}
}
