export class StartCourseGenerationResponseDto {
	started?: boolean;
	reason?: 'duplicate_active_job';
	jobId: string;
	status: string;
	phase: string;
	progress: number;
	jobType?: string;
	jobFamily?: string;
	jobIntent?: string;
	dedupeKey?: string | null;
	targetLabel?: string | null;
}
