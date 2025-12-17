import { Injectable } from '@nestjs/common';
import { AudioProviderRegistry } from 'src/modules/ai/infrasctructure/providers/audio-provider.registry';

@Injectable()
export class GeneratorLessonVideoUseCase {
	constructor(
		private readonly scripts: LessonRepositoryPort,
		private readonly registry: AudioProviderRegistry,
		private readonly media: MediaService,
	) {}

	async execute(input: {
		lessonId: string;
		imageProvider: string;
		audioProvider: string;
	}) {
		const sections = await this.scripts.getScriptSections(input.lessonId);

		const audioGen = this.registry.getProvider(input.audioProvider);

		for (const section of sections) {
			const audio = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
