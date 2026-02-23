export class StartAssetsGenerationResponseDto {
	started: boolean;
	message: string;
	courseId: string;
	jobId?: string;
	status?: 'pending' | 'processing';
	phase?: 'assets_prepare' | 'assets_processing' | 'assets_finalize';
	progress?: number;
}
