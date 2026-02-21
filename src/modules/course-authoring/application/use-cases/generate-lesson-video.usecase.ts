import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	MEDIA_SERVICE,
	type MediaPort,
} from 'src/shared/media/domain/ports/media.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';

@Injectable()
export class GeneratorLessonVideoUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly registry: ProviderRegistry,
		@Inject(MEDIA_SERVICE) private readonly media: MediaPort
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

		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}

		const imageGen = this.registry.getGenerateImageStrategy(
			input.imageProvider
		);
		const audioGen = this.registry.getGenerateAudioStrategy(
			input.audioProvider
		);

		for (const section of (lesson.content as any).scriptSection) {
			const image = await imageGen.generate({
				prompt: section.content,
				size: '1536x1024',
			});

			const audio = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
