import { GenerationJob } from '../../domain/entities/generation-job.types';

export interface StartGenerationJobResult {
	job: GenerationJob;
	started: boolean;
	reason?: 'duplicate_active_job';
}
