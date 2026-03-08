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
	StoragePort,
	UploadObjectResult,
} from 'src/shared/storage/domain/ports/storage.port';

@Injectable()
export class ManageLessonAssetsUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly storage: StoragePort
	) {}

	async uploadAudio(input: {
		lessonId: string;
		userId: string;
		file: Express.Multer.File;
	}): Promise<{ path: string; url: string }> {
		return this.upload(input, {
			bucket: 'lesson-audios',
			pathKey: 'audioPath',
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
		});
	}

	async deleteAudio(input: {
		lessonId: string;
		userId: string;
	}): Promise<void> {
		return this.remove(input, {
			bucket: 'lesson-audios',
			pathKey: 'audioPath',
		});
	}

	async deletePdf(input: { lessonId: string; userId: string }): Promise<void> {
		return this.remove(input, {
			bucket: 'lesson-assets',
			pathKey: 'pdfPath',
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
			await this.storage.deleteObject({ bucket: config.bucket, path: oldPath });
		}

		const originalName = input.file.originalname.replace(/\s+/g, '-');
		const uploadPath = `${input.userId}/${input.lessonId}/${Date.now()}-${originalName}`;
		let upload: UploadObjectResult;
		try {
			upload = await this.storage.upload({
				bucket: config.bucket,
				path: uploadPath,
				buffer: input.file.buffer,
				contentType: input.file.mimetype,
				upsert: true,
			});
		} catch (error) {
			throw new PreconditionFailedException(error.message);
		}

		await this.lessonRepository.update(
			input.lessonId,
			{
				content: {
					...content,
					[config.pathKey]: upload.path,
				},
			},
			authContext
		);

		return upload;
	}

	private async remove(
		input: { lessonId: string; userId: string },
		config: {
			bucket: string;
			pathKey: 'audioPath' | 'pdfPath';
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
			await this.storage.deleteObject({ bucket: config.bucket, path });
		}

		const updatedContent = { ...content };
		delete updatedContent[config.pathKey];

		await this.lessonRepository.update(
			input.lessonId,
			{
				content: updatedContent,
			},
			authContext
		);
	}
}
