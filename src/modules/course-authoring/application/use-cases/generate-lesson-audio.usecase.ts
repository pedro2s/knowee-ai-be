import { Inject, Injectable } from '@nestjs/common';
import { ProviderRegistry } from 'src/modules/ai/infrasctructure/providers/provider.registry';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import { MediaService } from 'src/shared/media/media.service';

@Injectable()
export class GenerateLessonAudioUseCase {
	// Renamed class
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly registry: ProviderRegistry,
		private readonly mediaService: MediaService,
	) {}

	async execute(input: {
		lessonId: string;
		imageProvider: string;
		audioProvider: string;
	}) {
		const lesson = await this.lessonRepository.findById(input.lessonId);
		if (!lesson) throw new Error('Aula não encontrada');

		const audioGen = this.registry.getAudioStrategy(input.audioProvider);

		const sections = lesson.content.scriptSection;

		for (const section of sections) {
			const audio = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
