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
import { MediaPort } from 'src/shared/media/domain/ports/media.port';
import { ProviderRegistry } from 'src/shared/ai-providers/infrastructure/registry/provider.registry';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

@Injectable()
export class GenerateLessonAudioUseCase {
	private readonly logger = new Logger(GenerateLessonAudioUseCase.name);

	// Renamed class
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly registry: ProviderRegistry,
		private readonly mediaService: MediaPort,
		private readonly storage: StoragePort
	) {}

	async execute(input: {
		lessonId: string;
		audioProvider: string;
		audioVoiceId?: string;
		userId: string;
		runInBackground?: boolean;
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

		const audioGen = this.registry.get(input.audioProvider, 'tts');

		const sections = (lesson.content as { scriptSections: ScriptSection[] })
			.scriptSections;

		if (!sections || sections.length === 0)
			throw new BadRequestException('Nenhum roteiro entrado para a aula.');

		const processAudio = async () => {
			this.logger.log(
				`[AudioJob] Iniciando geração de áudio para aula: ${lesson.title}`
			);

			const tempDir = await fs.mkdtemp('audio-');
			const tempFilePaths: string[] = [];

			try {
				for (const [i, section] of sections.entries()) {
					const { content: audioBuffer } = await audioGen.generate({
						text: section.content,
						voice: input.audioVoiceId,
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

				// Upload para object storage
				const storagePath = `${input.userId}/${
					input.lessonId
				}/${Date.now()}-audio.mp3`;

				// Remove áudio anterior se existir (opcional, mas boa prática para limpeza)
				const previousAudioPath = (lesson.content as { audioPath?: string })
					?.audioPath;
				if (previousAudioPath) {
					await this.storage.deleteObject({
						bucket: 'lesson-audios',
						path: previousAudioPath,
					});
				}

				const mergedAudioBuffer = await fs.readFile(mergedAudioPath);

				const upload = await this.storage.upload({
					bucket: 'lesson-audios',
					path: storagePath,
					buffer: mergedAudioBuffer,
					contentType: 'audio/mpeg',
					upsert: true,
				});

				const updatedContent = {
					...(lesson.content as object),
					audioPath: upload.path,
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
				throw error;
			} finally {
				await fs.rm(tempDir, { recursive: true, force: true });
			}
		};

		if (input.runInBackground === false) {
			await processAudio();
			return {
				message: 'Geração de áudio concluída.',
			};
		}

		void processAudio();

		return {
			message: 'Geração de áudio iniciada. Isso pode levar alguns minutos.',
		};
	}
}
