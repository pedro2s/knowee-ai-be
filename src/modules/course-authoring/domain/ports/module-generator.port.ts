import { GeneratedModule } from '../entities/course.types';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';

export interface GenerateModuleInput {
	currentCourseStructure: {
		title: string;
		description: string;
		modules?: Array<{
			title: string;
			description: string;
			orderIndex: number;
			lessons?: Array<{
				title: string;
				description: string;
				lessonType: string;
				orderIndex: number;
			}>;
		}>;
	};
}

export interface ModuleGeneratorPort {
	generate(
		context: InteractionContext<GenerateModuleInput>
	): Promise<InteractionResult<GeneratedModule>>;
}
