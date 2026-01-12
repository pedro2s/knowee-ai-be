import { GeneratedModule } from '../entities/course.types';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';

export interface GenerateModuleInput {
	courseId: string;
}

export interface ModuleGeneratorPort {
	generate(
		context: InteractionContext<GenerateModuleInput>
	): Promise<InteractionResult<GeneratedModule>>;
}
