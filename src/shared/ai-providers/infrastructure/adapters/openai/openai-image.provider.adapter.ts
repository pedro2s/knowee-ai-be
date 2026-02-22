import { InteractionResult } from 'src/shared/types/interaction';
import { ImageProviderPort } from '../../../domain/ports/image.provider.port';
import {
	Inject,
	Injectable,
	PreconditionFailedException,
} from '@nestjs/common';
import { OPENAI_CLIENT } from '../../../ai-providers.constants';
import { OpenAI } from 'openai/client';

@Injectable()
export class OpenAIImageProviderAdapter implements ImageProviderPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(input: {
		prompt: string;
		size: '1024x1024' | '1536x1024' | '1024x1536';
	}): Promise<InteractionResult<Buffer>> {
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

		const buffer = Buffer.from(res.data[0].b64_json, 'base64');

		return {
			content: buffer,
		};
	}
}
