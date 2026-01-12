import { GeneratedModule } from 'src/modules/course-authoring/domain/entities/course.types';
import {
	GenerateModuleInput,
	ModuleGeneratorPort,
} from 'src/modules/course-authoring/domain/ports/module-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';

export class OpenAIModuleGeneratorAdapter implements ModuleGeneratorPort {
	generate(
		context: InteractionContext<GenerateModuleInput>
	): Promise<InteractionResult<GeneratedModule>> {
		throw new Error('Method not implemented.');
	}
}
