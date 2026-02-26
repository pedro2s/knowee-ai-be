export const GENERATION_QUEUE = 'generation';

export const GENERATION_JOB_NAMES = {
	COURSE_GENERATE: 'course.generate',
	ASSETS_GENERATE: 'assets.generate',
	LESSON_AUDIO_GENERATE: 'lesson.audio.generate',
	LESSON_SECTION_VIDEO_GENERATE: 'lesson.section-video.generate',
	LESSON_MERGE_VIDEO_GENERATE: 'lesson.merge-video.generate',
} as const;

export type GenerationQueueJobName =
	(typeof GENERATION_JOB_NAMES)[keyof typeof GENERATION_JOB_NAMES];
