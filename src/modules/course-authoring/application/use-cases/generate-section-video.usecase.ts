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
	Scene,
	STORYBOARD_GENERATOR,
	type StoryboardGeneratorPort,
} from '../../domain/ports/storyboard-generator.port';
import { GenerateSectionVideoDto } from '../dtos/generate-section-video.dto';
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

	// Defina um estilo padrão para manter a consistência do vídeo inteiro
	private readonly NOTEBOOKLM_STYLE_PROMPT = `
	STYLE GUIDELINES:
	- Art Style: Modern Flat Vector Illustration (Corporate Memphis style).
	- Composition: Minimalist, plenty of negative space (solid background).
	- Colors: Pastel palete (Soft Blue, Mint Green, Light Gray, White, Dark Slate text elements).
	- Mood: Professional, calm, education, clean.
	- RESTRICTIONS: NO TEXT inside the image. NO photorealism. NO complex details. NO messy sketches.`;

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
		private readonly providerRegistry: ProviderRegistry
	) {}

	async execute(input: GenerateSectionVideoDto, userId: string) {
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

		if (!section.storyboard) {
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
			section.storyboard = storyboard;

			// Salva storyboard para economia de gastos e computação
			await this.lessonRepository.update(
				lesson.id,
				{
					content: {
						scriptSections: [...scriptSections],
					},
				},
				authContext
			);
		}

		const audioGen = this.providerRegistry.getGenerateAudioStrategy(
			input.ai?.provider || 'openai'
		);

		const imageGen = this.providerRegistry.getGenerateImageStrategy(
			input.ai?.provider || 'openai'
		);

		const tempDir = await fs.mkdtemp(`section-${section.id}-`);
		const tempFilePaths: string[] = [];

		const storyboard = section.storyboard as Scene[];
		console.log('Storyboard:', storyboard);

		try {
			for (const [i, scene] of storyboard.entries()) {
				// Lógica unificada de geração de imagem
				const coreConcept = scene.visualConcept;
				const finalImagePrompt = `Create a didactic illustration of: ${coreConcept}.
					${this.NOTEBOOKLM_STYLE_PROMPT}
					Make sure the background is a solid color (hex #F5F5F7) to match a video canvas.`;

				const [imageBuffer, audioBuffer] = await Promise.all([
					imageGen.generate({
						prompt: finalImagePrompt,
						size: '1536x1024', // Aspect ratio 3:2 é bom, mas 16:9 (1920x1080) é melhor para vídeo
					}),
					audioGen.generate({
						text: scene.narration,
					}),
				]);

				const imagePath = path.join(tempDir, `image-${i}.jpg`);
				const audioPath = path.join(tempDir, `scene-${i}.mp3`);
				await Promise.all([
					fs.writeFile(imagePath, imageBuffer),
					fs.writeFile(audioPath, audioBuffer),
				]);

				const outputPath = path.join(tempDir, `scene-${i}.mp4`);

				await this.mediaService.imageToVideo(imagePath, audioPath, outputPath);

				// Aqui está o segredo. Não chame apenas imageToVideo.
				// Você precisa passar opções de renderização para ficar "Bonito".
				/* await this.mediaService.createDynamicScene({
						imagePath,
						audioPath,
						outputPath,
						textOverlay: scene.narration, // O texto entra aqui, não na imagem!
					}); */

				tempFilePaths.push(outputPath);
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
			section.videoDuration = Math.trunc(durationInSeconds);
			section.videoStatus = 'ready';
			section.isRecorded = true;

			await this.lessonRepository.update(
				lesson.id,
				{
					content: {
						scriptSections: [...scriptSections],
					},
				},
				authContext
			);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}

		return section;
	}
}
