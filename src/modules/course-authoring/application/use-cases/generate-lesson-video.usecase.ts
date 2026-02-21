import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProviderRegistry as SharedProviderRegistry } from 'src/shared/ai-providers/infrastructrue/registry/provider.registry';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import {
	MEDIA_SERVICE,
	type MediaPort,
} from 'src/shared/media/domain/ports/media.port';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';

@Injectable()
export class GeneratorLessonVideoUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(MEDIA_SERVICE) private readonly media: MediaPort,
		private readonly providerRegistry: ProviderRegistry,
		private readonly sharedProviderRegistry: SharedProviderRegistry
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

		const imageGen = this.sharedProviderRegistry.get(
			input.imageProvider,
			'image'
		);
		const audioGen = this.sharedProviderRegistry.get(
			input.audioProvider,
			'tts'
		);

		for (const section of (lesson.content as any).scriptSection) {
			const { content: image } = await imageGen.generate({
				prompt: section.content,
				size: '1536x1024',
			});

			const { content: audio } = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
