import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import {
	GenerateAssessmentsInput,
	GeneratedAssessments,
} from '../entities/generated-assessments.types';

export const GENERATE_ASSESSMENTS_AGENT = Symbol('GENERATE_ASSESSMENTS_AGENT');

export interface GenerateAssessmentsAgentPort {
	generateAssessments(
		context: InteractionContext<GenerateAssessmentsInput>
	): Promise<InteractionResult<GeneratedAssessments>>;
}
