import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { ImageGeneratorPort } from 'src/modules/course-authoring/domain/ports/image-generator.port';

@Injectable()
export class OpenAIImageGeneratorAdapter implements ImageGeneratorPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(input: {
		prompt: string;
		size: '1920x1080' | '1024x1024';
	}): Promise<Buffer> {
		const res = await this.openai.images.generate({
			model: 'dall-e-3',
			prompt: input.prompt,
			size: input.size as any,
			response_format: 'b64_json',
			quality: 'standard',
			n: 1,
		});

		if (!res.data || res.data.length === 0 || !res.data[0].b64_json) {
			throw new Error(
				'Failed to generate image: No image data returned.',
			);
		}

		return Buffer.from(res.data[0].b64_json, 'base64');
	}
}
