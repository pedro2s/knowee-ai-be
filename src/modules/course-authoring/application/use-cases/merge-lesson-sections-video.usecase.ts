import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import { MediaPort } from 'src/shared/media/domain/ports/media.port';
import fs from 'fs/promises';
import path from 'path';
import { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

@Injectable()
export class MergeLessonSectionsVideoUseCase {
	private readonly logger = new Logger(MergeLessonSectionsVideoUseCase.name);

	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly storage: StoragePort,
		private readonly mediaService: MediaPort
	) {}

	async execute(lessonId: string, userId: string) {
		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const lesson = await this.lessonRepository.findById(lessonId, authContext);

		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}

		const scriptSections = (
			lesson.content as {
				scriptSections: ScriptSection[];
			}
		).scriptSections;

		// 2. Validate all script sections have videoPath
		const videosToMerge: { videoPath: string }[] = [];
		for (const section of scriptSections) {
			if (!section.videoPath) {
				throw new PreconditionFailedException(
					`Nem todas as seções possuem vídeos gerados. A seção com id ${section.id} não possui um vídeo. Por favor, gere os vídeos para todas as seções antes de tentar unificar.`
				);
			}
			videosToMerge.push({
				videoPath: section.videoPath,
			});
		}

		if (videosToMerge.length === 0) {
			throw new PreconditionFailedException('Não há vídeos para unificar.');
		}

		let tempDir: string | undefined;
		try {
			// 3. Create temp directory
			tempDir = await fs.mkdtemp(`merged-lesson-${lesson.id}-`);
			const downloadedVideoFilePaths: string[] = [];

			// 4. Download all section videos from storage to temp files
			for (const [index, video] of videosToMerge.entries()) {
				let videoBuffer: Buffer;
				try {
					videoBuffer = await this.storage.download({
						bucket: 'lesson-videos',
						path: video.videoPath,
					});
				} catch (error) {
					this.logger.error(
						`[MergeLessonSectionsVideoUseCase] Erro ao baixar vídeo do storage: ${error.message}`
					);
					throw new PreconditionFailedException(
						`Erro ao baixar vídeo da seção ${index + 1} do storage.`
					);
				}
				const tempFilePath = path.join(tempDir, `section-${index}.mp4`);
				await fs.writeFile(tempFilePath, videoBuffer);
				downloadedVideoFilePaths.push(tempFilePath);
			}

			// 5. Concatenate downloaded videos using mediaService.concatVideos
			const fileListContent = downloadedVideoFilePaths
				.map((filePath) => `file '${path.resolve(filePath)}'`)
				.join('\n');
			const fileListPath = path.join(tempDir, 'file_list.txt');
			await fs.writeFile(fileListPath, fileListContent);

			const finalVideoPath = path.join(tempDir, 'merged_video.mp4');
			await this.mediaService.concatVideos(fileListPath, finalVideoPath);

			// 6. Upload merged video to storage
			const mergedVideoBuffer = await fs.readFile(finalVideoPath);
			const storageUploadPath = `${userId}/${lesson.id}/merged-lesson-${Date.now()}.mp4`;

			let upload;
			try {
				upload = await this.storage.upload({
					bucket: 'lesson-videos',
					path: storageUploadPath,
					buffer: mergedVideoBuffer,
					contentType: 'video/mp4',
					upsert: true,
				});
			} catch (error) {
				this.logger.error(
					`[MergeLessonSectionsVideoUseCase] Erro no upload do vídeo mesclado para o storage: ${error.message}`
				);
				throw new PreconditionFailedException(
					'Erro no upload do vídeo mesclado para o storage.'
				);
			}

			// 7. Update lesson with merged video path/URL
			const durationInSeconds =
				await this.mediaService.getAudioDuration(finalVideoPath);

			await this.lessonRepository.update(
				lesson.id,
				{
					content: {
						...(lesson.content as any),
						finalVideoPath: upload.path,
						finalVideoStatus: 'ready',
					},
					duration: Math.trunc(durationInSeconds / 60),
				},
				authContext
			);

			return {
				message: 'Vídeos das seções mesclados com sucesso!',
				mergedVideoUrl: upload.url,
			};
		} catch (error) {
			this.logger.error(
				`[MergeLessonSectionsVideoUseCase] Falha ao mesclar vídeos da aula ${lesson.title}:`,
				error
			);
			throw error;
		} finally {
			// 8. Clean up temp directory
			if (tempDir) {
				await fs.rm(tempDir, { recursive: true, force: true });
			}
		}
	}
}
