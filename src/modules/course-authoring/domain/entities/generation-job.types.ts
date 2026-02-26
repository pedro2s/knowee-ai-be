export type GenerationJobStatus =
	| 'pending'
	| 'processing'
	| 'completed'
	| 'failed';

export type GenerationJobPhase =
	| 'structure'
	| 'demo_script'
	| 'demo_storyboard'
	| 'assets_prepare'
	| 'assets_processing'
	| 'assets_finalize'
	| 'lesson_audio'
	| 'lesson_section_video'
	| 'lesson_merge_video'
	| 'done';

export type GenerationJobType =
	| 'course_generation'
	| 'assets_generation'
	| 'lesson_audio_generation'
	| 'lesson_section_video_generation'
	| 'lesson_merge_video_generation';

export interface GenerationJobMetadata {
	jobType?: GenerationJobType;
	strategy?: 'on-demand' | 'selected' | 'all';
	providerSelection?: {
		imageProvider: string;
		audioProvider: string;
		audioVoiceId: string;
		videoProvider: string;
		advancedSettings?: Record<string, unknown>;
	};
	selectedLessonIds?: string[];
	lessonSummary?: {
		total: number;
		success: number;
		failed: number;
		skipped: number;
		items: Array<{
			lessonId: string;
			lessonType: string;
			status: 'success' | 'failed' | 'skipped';
			error?: string;
		}>;
	};
	moduleId?: string;
	lessonId?: string;
	demoSectionId?: string;
	demoSectionVideoUrl?: string;
	demoSectionVideoStatus?: 'ready' | 'missing' | 'failed';
	totalScenes?: number;
	totalSections?: number;
	sectionId?: string;
	[key: string]: unknown;
}

export interface GenerationJob {
	id: string;
	userId: string;
	courseId: string | null;
	status: GenerationJobStatus;
	jobType: GenerationJobType;
	phase: GenerationJobPhase;
	progress: number;
	queueName: string;
	queueJobId: string | null;
	attempts: number;
	maxAttempts: number;
	metadata: GenerationJobMetadata;
	error: string | null;
	startedAt: Date | null;
	heartbeatAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
}

export interface CreateGenerationJobInput {
	userId: string;
	courseId?: string | null;
	jobType?: GenerationJobType;
	phase?: GenerationJobPhase;
	status?: GenerationJobStatus;
	progress?: number;
	queueName?: string;
	queueJobId?: string | null;
	attempts?: number;
	maxAttempts?: number;
	metadata?: GenerationJobMetadata;
	startedAt?: Date | null;
	heartbeatAt?: Date | null;
}

export interface UpdateGenerationJobInput {
	courseId?: string | null;
	status?: GenerationJobStatus;
	jobType?: GenerationJobType;
	phase?: GenerationJobPhase;
	progress?: number;
	queueName?: string;
	queueJobId?: string | null;
	attempts?: number;
	maxAttempts?: number;
	metadata?: GenerationJobMetadata;
	error?: string | null;
	startedAt?: Date | null;
	heartbeatAt?: Date | null;
	completedAt?: Date | null;
}
