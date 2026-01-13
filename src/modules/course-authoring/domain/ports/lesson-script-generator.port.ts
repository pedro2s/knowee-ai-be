import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import {
	GeneratedLessonScript,
	GenerateLessonScriptInput,
} from '../entities/lesson-script.types';

export interface LessonScriptGeneratorPort {
	generate(
		context: InteractionContext<GenerateLessonScriptInput>
	): Promise<InteractionResult<GeneratedLessonScript>>;
}
