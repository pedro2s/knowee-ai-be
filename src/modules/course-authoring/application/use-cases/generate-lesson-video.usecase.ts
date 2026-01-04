import { Injectable } from '@nestjs/common';
import { MediaService } from 'src/shared/infrastructure/media/media.service';
import type { ScriptRepositoryPort } from '../../domain/ports/script-repository.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';

@Injectable()
export class GeneratorLessonVideoUseCase {
	constructor(
		private readonly scripts: ScriptRepositoryPort,
		private readonly registry: ProviderRegistry,
		private readonly media: MediaService,
	) {}

	async execute(input: {
		lessonId: string;
		imageProvider: string;
		audioProvider: string;
	}) {
		const sections = await this.scripts.getScriptSections(input.lessonId);

		const imageGen = this.registry.getImageStrategy(input.imageProvider);
		const audioGen = this.registry.getAudioStrategy(input.audioProvider);

		for (const section of sections) {
			const image = await imageGen.generate({
				prompt: section.content,
				size: '1920x1080',
			});

			const audio = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
