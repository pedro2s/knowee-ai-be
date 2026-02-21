import {
	Inject,
	Injectable,
	NotFoundException,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import {
	SUPABASE_SERVICE,
	type SupabasePort,
} from 'src/shared/supabase/domain/ports/supabase.port';

@Injectable()
export class ManageLessonAssetsUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(SUPABASE_SERVICE)
		private readonly supabaseService: SupabasePort
	) {}

	async uploadAudio(input: {
		lessonId: string;
		userId: string;
		file: Express.Multer.File;
	}): Promise<{ path: string; url: string }> {
		return this.upload(input, {
			bucket: 'lesson-audios',
			pathKey: 'audioPath',
			urlKey: 'audioUrl',
		});
	}

	async uploadPdf(input: {
		lessonId: string;
		userId: string;
		file: Express.Multer.File;
	}): Promise<{ path: string; url: string }> {
		return this.upload(input, {
			bucket: 'lesson-assets',
			pathKey: 'pdfPath',
			urlKey: 'pdfUrl',
		});
	}

	async deleteAudio(input: {
		lessonId: string;
		userId: string;
	}): Promise<void> {
		return this.remove(input, {
			bucket: 'lesson-audios',
			pathKey: 'audioPath',
			urlKey: 'audioUrl',
		});
	}

	async deletePdf(input: { lessonId: string; userId: string }): Promise<void> {
		return this.remove(input, {
			bucket: 'lesson-assets',
			pathKey: 'pdfPath',
			urlKey: 'pdfUrl',
		});
	}

	private async upload(
		input: {
			lessonId: string;
			userId: string;
			file: Express.Multer.File;
		},
		config: {
			bucket: string;
			pathKey: 'audioPath' | 'pdfPath';
			urlKey: 'audioUrl' | 'pdfUrl';
		}
	): Promise<{ path: string; url: string }> {
		const authContext: AuthContext = {
			userId: input.userId,
			role: 'authenticated',
		};
		const lesson = await this.lessonRepository.findById(
			input.lessonId,
			authContext
		);
		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}

		const content = (lesson.content as Record<string, unknown>) || {};
		const oldPath = content[config.pathKey] as string | undefined;
		if (oldPath) {
			await this.supabaseService
				.getClient()
				.storage.from(config.bucket)
				.remove([oldPath]);
		}

		const originalName = input.file.originalname.replace(/\s+/g, '-');
		const uploadPath = `${input.userId}/${input.lessonId}/${Date.now()}-${originalName}`;
		const upload = await this.supabaseService
			.getClient()
			.storage.from(config.bucket)
			.upload(uploadPath, input.file.buffer, {
				contentType: input.file.mimetype,
				upsert: true,
			});

		if (upload.error) {
			throw new PreconditionFailedException(upload.error.message);
		}

		const publicUrl = this.supabaseService
			.getClient()
			.storage.from(config.bucket)
			.getPublicUrl(uploadPath).data.publicUrl;

		await this.lessonRepository.update(
			input.lessonId,
			{
				content: {
					...content,
					[config.pathKey]: uploadPath,
					[config.urlKey]: publicUrl,
				},
			},
			authContext
		);

		return { path: uploadPath, url: publicUrl };
	}

	private async remove(
		input: { lessonId: string; userId: string },
		config: {
			bucket: string;
			pathKey: 'audioPath' | 'pdfPath';
			urlKey: 'audioUrl' | 'pdfUrl';
		}
	): Promise<void> {
		const authContext: AuthContext = {
			userId: input.userId,
			role: 'authenticated',
		};
		const lesson = await this.lessonRepository.findById(
			input.lessonId,
			authContext
		);
		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}

		const content = (lesson.content as Record<string, unknown>) || {};
		const path = content[config.pathKey] as string | undefined;
		if (path) {
			await this.supabaseService
				.getClient()
				.storage.from(config.bucket)
				.remove([path]);
		}

		const updatedContent = { ...content };
		delete updatedContent[config.pathKey];
		delete updatedContent[config.urlKey];

		await this.lessonRepository.update(
			input.lessonId,
			{
				content: updatedContent,
			},
			authContext
		);
	}
}
