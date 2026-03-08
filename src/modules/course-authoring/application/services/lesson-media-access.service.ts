import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { StoragePort } from 'src/shared/storage/domain/ports/storage.port';
import { Lesson } from '../../domain/entities/lesson.entity';

type MediaDisposition = 'inline' | 'attachment';

interface ResolvedLessonMedia {
	bucket: string;
	path: string;
	filename: string;
}

interface ScriptSectionLike {
	id?: string;
	videoPath?: string;
	videoUrl?: string;
	[key: string]: unknown;
}

@Injectable()
export class LessonMediaAccessService {
	private static readonly DEFAULT_TTL_SECONDS = 60 * 15;

	constructor(private readonly storage: StoragePort) {}

	async enrichContent(content: unknown): Promise<unknown> {
		const safeContent = this.getSafeContent(content);
		const enrichedContent: Record<string, unknown> = { ...safeContent };

		enrichedContent.audioUrl = await this.resolveOptionalUrl({
			bucket: 'lesson-audios',
			path: this.getString(safeContent.audioPath),
			disposition: 'inline',
		});
		enrichedContent.pdfUrl = await this.resolveOptionalUrl({
			bucket: 'lesson-assets',
			path: this.getString(safeContent.pdfPath),
			disposition: 'inline',
		});
		enrichedContent.finalVideoUrl = await this.resolveOptionalUrl({
			bucket: 'lesson-videos',
			path: this.getString(safeContent.finalVideoPath),
			disposition: 'inline',
		});

		if (Array.isArray(safeContent.scriptSections)) {
			const scriptSections = safeContent.scriptSections as unknown[];
			enrichedContent.scriptSections = await Promise.all(
				scriptSections.map(async (section) => {
					if (
						!section ||
						typeof section !== 'object' ||
						Array.isArray(section)
					) {
						return section;
					}

					const typedSection = section as ScriptSectionLike;
					return {
						...typedSection,
						videoUrl: await this.resolveOptionalUrl({
							bucket: 'lesson-videos',
							path: this.getString(typedSection.videoPath),
							disposition: 'inline',
						}),
					};
				})
			);
		}

		return enrichedContent;
	}

	async getLessonMediaAccess(
		lesson: Lesson,
		input: {
			kind: 'audio' | 'pdf' | 'finalVideo' | 'sectionVideo';
			disposition?: MediaDisposition;
			sectionId?: string;
		}
	): Promise<{ url: string; expiresAt: string }> {
		const resolved = this.resolveMedia(lesson, input);
		const expiresInSeconds = LessonMediaAccessService.DEFAULT_TTL_SECONDS;
		const url = await this.storage.getAccessUrl({
			bucket: resolved.bucket,
			path: resolved.path,
			disposition: input.disposition ?? 'inline',
			expiresInSeconds,
			filename: resolved.filename,
		});

		return {
			url,
			expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
		};
	}

	private async resolveOptionalUrl(input: {
		bucket: string;
		path: string | null;
		disposition: MediaDisposition;
	}): Promise<string | undefined> {
		if (!input.path) {
			return undefined;
		}

		return this.storage.getAccessUrl({
			bucket: input.bucket,
			path: input.path,
			disposition: input.disposition,
			expiresInSeconds: LessonMediaAccessService.DEFAULT_TTL_SECONDS,
			filename: this.extractFileName(input.path),
		});
	}

	private resolveMedia(
		lesson: Lesson,
		input: {
			kind: 'audio' | 'pdf' | 'finalVideo' | 'sectionVideo';
			sectionId?: string;
		}
	): ResolvedLessonMedia {
		const content = this.getSafeContent(lesson.content);

		if (input.kind === 'audio') {
			return this.ensureResolvedMedia(
				'lesson-audios',
				this.getString(content.audioPath)
			);
		}

		if (input.kind === 'pdf') {
			return this.ensureResolvedMedia(
				'lesson-assets',
				this.getString(content.pdfPath)
			);
		}

		if (input.kind === 'finalVideo') {
			return this.ensureResolvedMedia(
				'lesson-videos',
				this.getString(content.finalVideoPath)
			);
		}

		if (!input.sectionId) {
			throw new BadRequestException(
				'sectionId é obrigatório para acessar mídia do tipo sectionVideo'
			);
		}

		const sections = Array.isArray(content.scriptSections)
			? content.scriptSections
			: [];
		const section = sections.find(
			(item) =>
				item &&
				typeof item === 'object' &&
				(item as ScriptSectionLike).id === input.sectionId
		) as ScriptSectionLike | undefined;

		if (!section) {
			throw new NotFoundException('Seção da aula não encontrada');
		}

		return this.ensureResolvedMedia(
			'lesson-videos',
			this.getString(section.videoPath)
		);
	}

	private ensureResolvedMedia(
		bucket: string,
		path: string | null
	): ResolvedLessonMedia {
		if (!path) {
			throw new NotFoundException('Mídia não disponível para esta aula');
		}

		return {
			bucket,
			path,
			filename: this.extractFileName(path),
		};
	}

	private getSafeContent(value: unknown): Record<string, unknown> {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}

		return {};
	}

	private getString(value: unknown): string | null {
		return typeof value === 'string' && value.trim().length > 0 ? value : null;
	}

	private extractFileName(path: string): string {
		const segments = path.split('/');
		return segments[segments.length - 1] || 'arquivo';
	}
}
