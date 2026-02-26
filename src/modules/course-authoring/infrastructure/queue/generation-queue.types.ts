import { GenerateCourseDto } from '../../application/dtos/generate-course.dto';
import { StartAssetsGenerationDto } from '../../application/dtos/start-assets-generation.dto';
import { GenerateSectionVideoDto } from '../../application/dtos/generate-section-video.dto';

export interface QueueStoredFilePayload {
	originalname: string;
	mimetype?: string;
	bufferBase64: string;
}

export interface CourseGenerationJobPayload {
	type: 'course_generation';
	data: GenerateCourseDto;
	files: QueueStoredFilePayload[];
}

export interface AssetsGenerationJobPayload {
	type: 'assets_generation';
	data: StartAssetsGenerationDto;
}

export interface LessonAudioGenerationJobPayload {
	type: 'lesson_audio_generation';
	lessonId: string;
	audioProvider: string;
	audioVoiceId?: string;
}

export interface LessonSectionVideoGenerationJobPayload {
	type: 'lesson_section_video_generation';
	data: GenerateSectionVideoDto;
}

export interface LessonMergeVideoGenerationJobPayload {
	type: 'lesson_merge_video_generation';
	lessonId: string;
}

export type PersistedGenerationJobPayload =
	| CourseGenerationJobPayload
	| AssetsGenerationJobPayload
	| LessonAudioGenerationJobPayload
	| LessonSectionVideoGenerationJobPayload
	| LessonMergeVideoGenerationJobPayload;

export interface GenerationQueueJobData {
	jobId: string;
	userId: string;
}
