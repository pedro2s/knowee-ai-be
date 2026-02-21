import * as fs from 'fs/promises';
import * as path from 'path';
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
} from 'src/shared/media/domain/ports/media.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import {
	SUPABASE_SERVICE,
	type SupabasePort,
} from 'src/shared/supabase/domain/ports/supabase.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';

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
		const authContex: AuthContext = {
			userId: input.userId,
			role: 'authenticated',
		};

		const lesson = await this.lessonRepository.findById(
			input.lessonId,
			authContex
		);

		if (!lesson) throw new NotFoundException('Aula não encontrada');

		const audioGen = this.registry.getGenerateAudioStrategy(
			input.audioProvider
		);

		const sections = (lesson.content as { scriptSections: ScriptSection[] })
			.scriptSections;

		if (!sections || sections.length === 0)
			throw new BadRequestException('Nenhum roteiro entrado para a aula.');

		void (async () => {
			this.logger.log(
				`[AudioJob] Iniciando geração de áudio para aula: ${lesson.title}`
			);

			const tempDir = await fs.mkdtemp('audio-');
			const tempFilePaths: string[] = [];

			try {
				for (const [i, section] of sections.entries()) {
					const audioBuffer = await audioGen.generate({
						text: section.content,
					});
					const tempFilePath = path.join(tempDir, `section-${i}.mp3`);
					await fs.writeFile(tempFilePath, audioBuffer);
					tempFilePaths.push(tempFilePath);
				}

				const mergedAudioPath = path.join(tempDir, 'final-audio.mp3');
				await this.mediaService.mergeAudios(tempFilePaths, mergedAudioPath);
				const durationInSeconds =
					await this.mediaService.getAudioDuration(mergedAudioPath);
				const durationInMinutes = Math.ceil(durationInSeconds / 60);

				// Upload para Supabase Storage
				const supabasePath = `${input.userId}/${
					input.lessonId
				}/${Date.now()}-audio.mp3`;

				// Remove áudio anterior se existir (opcional, mas boa prática para limpeza)
				const previousAudioPath = (lesson.content as { audioPath?: string })
					?.audioPath;
				if (previousAudioPath) {
					await this.supabaseService
						.getClient()
						.storage.from('lesson-audios')
						.remove([previousAudioPath]);
				}

				const mergedAudioBuffer = await fs.readFile(mergedAudioPath);

				const { error: uploadError } = await this.supabaseService
					.getClient()
					.storage.from('lesson-audios') // Assuming 'lessons' bucket
					.upload(supabasePath, mergedAudioBuffer, {
						contentType: 'audio/mpeg',
						upsert: true,
					});

				if (uploadError) {
					this.logger.error(
						`[AudioJob] Erro no upload para o Supabase: ${uploadError.message}`
					);
					// decide if I should throw, for now just logging. The job is async.
					return;
				}

				const { data: publicUrlData } = this.supabaseService
					.getClient()
					.storage.from('lesson-audios')
					.getPublicUrl(supabasePath);

				const updatedContent = {
					...(lesson.content as object),
					audioPath: supabasePath,
					audioUrl: publicUrlData.publicUrl,
				};

				await this.lessonRepository.update(
					lesson.id,
					{
						content: updatedContent,
						duration: durationInMinutes,
					},
					authContex
				);

				this.logger.log(
					`[AudioJob] Geração de áudio para a aula "${lesson.title}" concluída com sucesso.`
				);
			} catch (error) {
				this.logger.error(
					`[AudioJob] Falha na geração de áudio para a aula: ${lesson.title}`,
					error
				);
			} finally {
				await fs.rm(tempDir, { recursive: true, force: true });
			}
		})();

		return {
			message: 'Geração de áudio iniciada. Isso pode levar alguns minutos.',
		};
	}
}
