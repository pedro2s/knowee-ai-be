import {
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	MEDIA_SERVICE,
	type MediaPort,
} from 'src/shared/application/ports/media.port';
import {
	STORYBOARD_GENERATOR,
	type StoryboardGeneratorPort,
} from '../../domain/ports/storyboard-generator.port';
import { GenerateVideoDto } from '../dtos/generate-video.dto';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import {
	SUPABASE_SERVICE,
	type SupabasePort,
} from 'src/shared/application/ports/supabase.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import fs from 'fs/promises';
import path from 'path';

@Injectable()
export class GenerateSectionVideoUseCase {
	private readonly logger = new Logger(GenerateSectionVideoUseCase.name);

	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(MEDIA_SERVICE) private readonly media: MediaPort,
		@Inject(STORYBOARD_GENERATOR)
		private readonly storyboardGenerator: StoryboardGeneratorPort,
		@Inject(MEDIA_SERVICE)
		private readonly mediaService: MediaPort,
		@Inject(SUPABASE_SERVICE)
		private readonly supabaseService: SupabasePort,
		private readonly registry: ProviderRegistry
	) {}

	async execute(input: GenerateVideoDto, userId: string) {
		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const lesson = await this.lessonRepository.findById(
			input.lessonId,
			authContext
		);

		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}

		const module = await this.moduleRepository.findById(
			lesson.moduleId,
			authContext
		);

		const course = await this.courseRepository.findById(
			module!.courseId,
			authContext
		);

		const scriptSections = (
			lesson.content as {
				scriptSections: ScriptSection[];
			}
		).scriptSections;
		const sectionIndex = scriptSections.findIndex(
			(section) => section.id === input.sectionId
		);

		if (sectionIndex === -1) {
			throw new NotFoundException('Roteiro não encontrado');
		}
		const section = scriptSections[sectionIndex];

		const { storyboard } = await this.storyboardGenerator.generate({
			course: {
				title: course!.title,
				description: course?.description || '',
			},
			module: {
				title: module!.title,
				description: module!.description || '',
			},
			lesson: {
				title: lesson.title,
				description: lesson.description || '',
			},
			script: section.content,
		});

		console.log('Storyboard:', storyboard);

		const audioGen = this.registry.getGenerateAudioStrategy(
			input.ai?.provider || 'openai'
		);

		let videoUrl: string | undefined = undefined;

		const tempDir = await fs.mkdtemp(`section-${section.id}-`);
		const tempFilePaths: string[] = [];

		try {
			for (const [i, scene] of storyboard.entries()) {
				let imagePath: string | undefined;

				// obter a imagem para gerar o video da sena
				if (scene.visual.type === 'stock_video') {
					try {
						const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
						const imageSearchQuery = scene.visual.searchQuery;

						const response = await fetch(
							`https://api.unsplash.com/search/photos?client_id=${UNSPLASH_ACCESS_KEY}&query=${imageSearchQuery}`
						);
						const data = await response.json();

						if (data.results?.length === 0) {
							// Gerar uma imagem com IA
						} else {
							// Salvar a image o Unsplash no temDir
							const imageUrl = data.results[0].urls.regular;
							const imageResponse = await fetch(imageUrl);
							const arrayBuffer = await imageResponse.arrayBuffer();
							const imageBuffer = Buffer.from(arrayBuffer);
							imagePath = path.join(tempDir, `image-${i}.jpg`);
							await fs.writeFile(imagePath, imageBuffer);
						}
					} catch (error: any) {
						this.logger.error(
							'[GenerateSectionVideoUseCase] Falha ao obter imagem do Unsplash',
							error
						);
						throw new PreconditionFailedException(
							'Falha ao obter/gerar imagem da cena'
						);
					}
				}

				// gerar o áudio da sena
				const audioBuffer = await audioGen.generate({
					text: scene.audioText,
				});
				const audioPath = path.join(tempDir, `scene-${i}.mp3`);
				await fs.writeFile(audioPath, audioBuffer);

				if (imagePath && audioPath) {
					const videoPath = path.join(tempDir, `scene-${i}.mp4`);
					await this.mediaService.imageToVideo(imagePath, audioPath, videoPath);
					tempFilePaths.push(videoPath);
				}
			}

			if (tempFilePaths.length === 0) {
				throw new PreconditionFailedException('Nenhum vídeo gerado');
			}

			// faz o concat dos vídeos
			const fileListContent = tempFilePaths
				.map((filePath) => `file '${path.resolve(filePath)}'`)
				.join('\n');
			const fileListPath = path.join(tempDir, 'file_list.txt');
			await fs.writeFile(fileListPath, fileListContent);

			// concatena os vídeos
			const finalVideoPath = path.join(tempDir, 'final_video.mp4');
			await this.mediaService.concatVideos(fileListPath, finalVideoPath);
			const durationInSeconds =
				await this.mediaService.getAudioDuration(finalVideoPath);

			// Upload para Supabase Storage
			const supabasePath = `${userId}/${lesson.id}/${Date.now()}-video.mp4`;

			// Remove vídeo anterior se existir
			const previousVideoPath = (lesson.content as { videoPath?: string })
				?.videoPath;
			if (previousVideoPath) {
				await this.supabaseService
					.getClient()
					.storage.from('lesson-videos')
					.remove([previousVideoPath]);
			}

			const finalVideoBuffer = await fs.readFile(finalVideoPath);

			const { error: uploadError } = await this.supabaseService
				.getClient()
				.storage.from('lesson-videos') // Assuming 'lessons' bucket
				.upload(supabasePath, finalVideoBuffer, {
					contentType: 'video/mp4',
					upsert: true,
				});

			if (uploadError) {
				this.logger.error(
					`[GenerateSectionVideoUseCase] Erro no upload para o Supabase: ${uploadError.message}`
				);
				// decide if I should throw
				throw new PreconditionFailedException('Erro no upload para o storage');
			}

			// Obtem a url publica do vído no Supabase
			const { data: publicUrlData } = this.supabaseService
				.getClient()
				.storage.from('lesson-videos')
				.getPublicUrl(supabasePath);

			section.videoPath = supabasePath;
			section.videoUrl = publicUrlData.publicUrl;
			section.videoDuration = durationInSeconds;

			// URL final do vídeo
			videoUrl = section.videoUrl;

			await this.lessonRepository.update(
				lesson.id,
				{
					content: {
						scriptSections: [...scriptSections],
					},
				},
				authContext
			);
		} catch (error) {
			this.logger.error(
				`[GenerateSectionVideoUseCase] Falha na geração de vídeo para a aula: ${lesson.title}`,
				error
			);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}

		return { videoUrl };
	}
}
