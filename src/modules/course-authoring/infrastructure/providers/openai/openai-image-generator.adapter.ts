import {
	Inject,
	Injectable,
	PreconditionFailedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { ImageGeneratorPort } from 'src/modules/course-authoring/domain/ports/image-generator.port';

@Injectable()
export class OpenAIImageGeneratorAdapter implements ImageGeneratorPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(input: {
		prompt: string;
		size: '1024x1024' | '1536x1024' | '1024x1536';
	}): Promise<Buffer> {
		const res = await this.openai.images.generate({
			model: 'gpt-image-1-mini',
			prompt: input.prompt,
			size: input.size as any,
			quality: 'medium',
			n: 1,
		});

		if (!res.data || res.data.length === 0 || !res.data[0].b64_json) {
			throw new PreconditionFailedException(
				'Falha ao gerar imagem: Nenhuma imagem retornada.'
			);
		}

		return Buffer.from(res.data[0].b64_json, 'base64');
	}
}
