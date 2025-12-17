import { Injectable } from '@nestjs/common';
import { AudioProviderRegistry } from 'src/modules/ai/infrasctructure/providers/audio-provider.registry';

@Injectable()
export class GeneratorLessonVideoUseCase {
	constructor(
		private readonly scripts: ScriptRepositoryPort,
		private readonly registry: AudioProviderRegistry,
		private readonly media: MediaService,
	) {}

	async execute(input: {
		lessonId: string;
		imageProvider: string;
		audioProvider: string;
	}) {
		const sections = await this.scripts.getScriptSections(input.lessonId);

		const imageGen = this.registry.getImage(input.imageProvider);
		const audioGen = this.registry.getProvider(input.audioProvider);

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
