export type GenerationJobStatus =
	| 'pending'
	| 'processing'
	| 'completed'
	| 'failed';

export type GenerationJobPhase =
	| 'structure'
	| 'demo_script'
	| 'demo_storyboard'
	| 'demo_section_video'
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

export type GenerationJobFamily =
	| 'course'
	| 'asset_batch'
	| 'lesson_audio'
	| 'lesson_section_video'
	| 'lesson_merge_video';

export interface GenerationJobScope {
	courseId: string | null;
	lessonId: string | null;
	sectionId: string | null;
}

export interface GenerationJobMetadata {
	jobType?: GenerationJobType;
	jobFamily?: GenerationJobFamily;
	jobIntent?: string;
	dedupeKey?: string | null;
	targetLabel?: string | null;
	scope?: Partial<GenerationJobScope>;
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
			readiness: 'ready' | 'blocked';
			error?: string;
		}>;
	};
	isExportReady?: boolean;
	blockingIssues?: Array<{
		lessonId: string;
		lessonType: string;
		code: string;
		message: string;
	}>;
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
	jobFamily: GenerationJobFamily;
	jobIntent: string;
	phase: GenerationJobPhase;
	progress: number;
	dedupeKey: string | null;
	targetLabel: string | null;
	scope: GenerationJobScope;
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
	jobFamily?: GenerationJobFamily;
	jobIntent?: string;
	phase?: GenerationJobPhase;
	status?: GenerationJobStatus;
	progress?: number;
	dedupeKey?: string | null;
	targetLabel?: string | null;
	scope?: GenerationJobScope;
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
	jobFamily?: GenerationJobFamily;
	jobIntent?: string;
	phase?: GenerationJobPhase;
	progress?: number;
	dedupeKey?: string | null;
	targetLabel?: string | null;
	scope?: GenerationJobScope;
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
