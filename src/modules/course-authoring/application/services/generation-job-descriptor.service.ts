import {
	GenerationJob,
	GenerationJobFamily,
	GenerationJobMetadata,
	GenerationJobScope,
	GenerationJobType,
} from '../../domain/entities/generation-job.types';

interface BuildDescriptorInput {
	jobType: GenerationJobType;
	courseId?: string | null;
	lessonId?: string | null;
	sectionId?: string | null;
	targetLabel?: string | null;
	selectedLessonIds?: string[];
}

export interface GenerationJobDescriptor {
	jobFamily: GenerationJobFamily;
	jobIntent: string;
	dedupeKey: string | null;
	targetLabel: string | null;
	scope: GenerationJobScope;
}

const getJobFamily = (jobType: GenerationJobType): GenerationJobFamily => {
	switch (jobType) {
		case 'assets_generation':
			return 'asset_batch';
		case 'lesson_audio_generation':
			return 'lesson_audio';
		case 'lesson_section_video_generation':
			return 'lesson_section_video';
		case 'lesson_merge_video_generation':
			return 'lesson_merge_video';
		default:
			return 'course';
	}
};

const getJobIntent = (jobType: GenerationJobType): string => {
	switch (jobType) {
		case 'assets_generation':
			return 'Gerando assets';
		case 'lesson_audio_generation':
			return 'Gerando audio da aula';
		case 'lesson_section_video_generation':
			return 'Gerando video da secao';
		case 'lesson_merge_video_generation':
			return 'Gerando video final da aula';
		default:
			return 'Gerando curso';
	}
};

const buildAssetsSelectionHash = (selectedLessonIds?: string[]) => {
	if (!selectedLessonIds?.length) {
		return 'empty';
	}

	return [...selectedLessonIds].sort().join(',');
};

export class GenerationJobDescriptorService {
	static build(input: BuildDescriptorInput): GenerationJobDescriptor {
		const scope: GenerationJobScope = {
			courseId: input.courseId ?? null,
			lessonId: input.lessonId ?? null,
			sectionId: input.sectionId ?? null,
		};

		switch (input.jobType) {
			case 'assets_generation':
				return {
					jobFamily: 'asset_batch',
					jobIntent: getJobIntent(input.jobType),
					dedupeKey: input.courseId
						? `course:${input.courseId}:assets:${buildAssetsSelectionHash(
								input.selectedLessonIds
							)}`
						: null,
					targetLabel:
						input.targetLabel ??
						`${input.selectedLessonIds?.length ?? 0} aula(s) selecionada(s)`,
					scope,
				};
			case 'lesson_audio_generation':
				return {
					jobFamily: 'lesson_audio',
					jobIntent: getJobIntent(input.jobType),
					dedupeKey: input.lessonId ? `lesson:${input.lessonId}:audio` : null,
					targetLabel: input.targetLabel ?? null,
					scope,
				};
			case 'lesson_section_video_generation':
				return {
					jobFamily: 'lesson_section_video',
					jobIntent: getJobIntent(input.jobType),
					dedupeKey:
						input.lessonId && input.sectionId
							? `lesson:${input.lessonId}:section:${input.sectionId}:video`
							: null,
					targetLabel: input.targetLabel ?? null,
					scope,
				};
			case 'lesson_merge_video_generation':
				return {
					jobFamily: 'lesson_merge_video',
					jobIntent: getJobIntent(input.jobType),
					dedupeKey: input.lessonId
						? `lesson:${input.lessonId}:merge-video`
						: null,
					targetLabel: input.targetLabel ?? null,
					scope,
				};
			default:
				return {
					jobFamily: 'course',
					jobIntent: getJobIntent(input.jobType),
					dedupeKey: input.courseId
						? `course:${input.courseId}:generation`
						: null,
					targetLabel: input.targetLabel ?? null,
					scope,
				};
		}
	}

	static toMetadata(
		descriptor: GenerationJobDescriptor
	): Partial<GenerationJobMetadata> {
		return {
			jobFamily: descriptor.jobFamily,
			jobIntent: descriptor.jobIntent,
			dedupeKey: descriptor.dedupeKey,
			targetLabel: descriptor.targetLabel,
			scope: descriptor.scope,
		};
	}

	static fromJob(job: GenerationJob): GenerationJobDescriptor {
		return {
			jobFamily: job.jobFamily,
			jobIntent: job.jobIntent,
			dedupeKey: job.dedupeKey,
			targetLabel: job.targetLabel,
			scope: job.scope,
		};
	}

	static fallbackFromMetadata(
		jobType: GenerationJobType,
		metadata: GenerationJobMetadata,
		courseId: string | null
	): GenerationJobDescriptor {
		return this.build({
			jobType,
			courseId,
			lessonId: metadata.lessonId ?? null,
			sectionId: metadata.sectionId ?? null,
			targetLabel: (metadata.targetLabel as string | undefined) ?? null,
			selectedLessonIds: metadata.selectedLessonIds ?? [],
		});
	}
}
