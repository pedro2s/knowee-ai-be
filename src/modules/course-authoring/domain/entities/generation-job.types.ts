export type GenerationJobStatus =
	| 'pending'
	| 'processing'
	| 'completed'
	| 'failed';

export type GenerationJobPhase =
	| 'structure'
	| 'demo_script'
	| 'demo_storyboard'
	| 'done';

export interface GenerationJobMetadata {
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
