import { Injectable } from '@nestjs/common';
import { ImageGeneratorPort } from 'src/modules/ai/domain/ports/image-generator.port';

@Injectable()
export class OpenAIImageGeneratorAdapter implements ImageGeneratorPort {
	async generate(input: {
		prompt: string;
		size: '1920x1080' | '1024x1024';
	}): Promise<Buffer> {
		const res = await openai.images.generate({
			model: 'gpt-image-1',
			prompt: input.prompt,
			size: input.size,
		});

		return Buffer.from(res.data[0].b64_json, 'base64');
	}
}
