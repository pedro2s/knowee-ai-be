import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import {
	MEDIA_SERVICE,
	type MediaPort,
} from 'src/shared/application/ports/media.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import {
	SUPABASE_SERVICE,
	type SupabasePort,
} from 'src/shared/application/ports/supabase.port';

@Injectable()
export class GenerateLessonAudioUseCase {
	private readonly logger = new Logger(GenerateLessonAudioUseCase.name);

	// Renamed class
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly registry: ProviderRegistry,
		@Inject(MEDIA_SERVICE)
		private readonly mediaService: MediaPort,
		@Inject(SUPABASE_SERVICE)
		private readonly supabaseService: SupabasePort
	) {}

	async execute(input: {
		lessonId: string;
		audioProvider: string;
		userId: string;
	}) {
		const lesson = await this.lessonRepository.findById(input.lessonId, {
			userId: input.userId,
			role: 'authenticated',
		});

		if (!lesson) throw new NotFoundException('Aula não encontrada');

		const audioGen = this.registry.getGenerateAudioStrategy(
			input.audioProvider
		);

		const sections = (lesson.content as { scriptSection: ScriptSection[] })
			.scriptSection;

		if (!sections || sections.length === 0)
			throw new BadRequestException('Nenhum roteiro entrado para a aula.');

		void (async () => {
			this.logger.log(
				`[AudioJob] Iniciando geração de áudio para aula: ${lesson.title}`
			);

			for (const section of sections) {
				const audioBuffer = await audioGen.generate({
					text: section.content,
				});

				// Aqui entra o MediaService (FFmpeg)
			}
		})();

		return {
			message: 'Geração de áudio iniciada. Isso pode levar alguns minutos.',
		};
	}
}
