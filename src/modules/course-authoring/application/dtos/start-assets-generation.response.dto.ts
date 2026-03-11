export class StartAssetsGenerationResponseDto {
	started: boolean;
	message: string;
	courseId: string;
	jobId?: string;
	reason?: 'duplicate_active_job';
	status?: 'pending' | 'processing' | 'completed' | 'failed';
	phase?: 'assets_prepare' | 'assets_processing' | 'assets_finalize' | 'done';
	progress?: number;
	jobType?: string;
	jobFamily?: string;
	jobIntent?: string;
	dedupeKey?: string | null;
	targetLabel?: string | null;
}
