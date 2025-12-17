import { Inject, Injectable } from '@nestjs/common';
import { ProviderRegistry } from 'src/modules/ai/infrasctructure/providers/provider.registry';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { MediaService } from 'src/shared/media/media.service';
import { DrizzleLessonRepository } from '../../infrastructure/persistence/drizzle/repositories/drizzle-lesson.repository';

@Injectable()
export class GenerateLessonAudioUseCase {
	// Renamed class
	constructor(
		@Inject(DrizzleLessonRepository)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly registry: ProviderRegistry,
		private readonly mediaService: MediaService,
	) {}

	async execute(input: {
		lessonId: string;
		imageProvider: string;
		audioProvider: string;
	}) {
		const sections = await this.lessonRepository.getScriptSections(
			input.lessonId,
		);

		const audioGen = this.registry.getAudioStrategy(input.audioProvider);

		for (const section of sections) {
			const audio = await audioGen.generate({
				text: section.content,
			});

			// Aqui entra o MediaService (FFmpeg)
		}
	}
}
