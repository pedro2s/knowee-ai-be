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
	| 'done';

export interface GenerationJobMetadata {
	jobType?: 'course_generation' | 'assets_generation';
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
	totalScenes?: number;
	totalSections?: number;
	[key: string]: unknown;
}

export interface GenerationJob {
	id: string;
	userId: string;
	courseId: string | null;
	status: GenerationJobStatus;
	phase: GenerationJobPhase;
	progress: number;
	metadata: GenerationJobMetadata;
	error: string | null;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
}

export interface CreateGenerationJobInput {
	userId: string;
	courseId?: string | null;
	phase?: GenerationJobPhase;
	status?: GenerationJobStatus;
	progress?: number;
	metadata?: GenerationJobMetadata;
}

export interface UpdateGenerationJobInput {
	courseId?: string | null;
	status?: GenerationJobStatus;
	phase?: GenerationJobPhase;
	progress?: number;
	metadata?: GenerationJobMetadata;
	error?: string | null;
	completedAt?: Date | null;
}
