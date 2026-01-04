import { Inject, Injectable } from '@nestjs/common';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import {
	MEDIA_SERVICE,
	type MediaPort,
} from 'src/shared/application/ports/media.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';

@Injectable()
export class GenerateLessonAudioUseCase {
	// Renamed class
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly registry: ProviderRegistry,
		@Inject(MEDIA_SERVICE) private readonly mediaService: MediaPort,
	) {}

	async execute(input: {
		lessonId: string;
		imageProvider: string;
		audioProvider: string;
		userId: string;
	}) {
		const lesson = await this.lessonRepository.findById(input.lessonId, {
			userId: input.userId,
			role: 'authenticated',
		});

		if (!lesson) throw new Error('Aula não encontrada');

		const audioGen = this.registry.getAudioStrategy(input.audioProvider);

		const sections = (lesson.content as { scriptSection: any[] })
			.scriptSection;

		for (const section of sections) {
			const audio = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
