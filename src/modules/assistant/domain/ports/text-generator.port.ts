import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import {
	GeneratedTextOutput,
	GenerateTextInput,
} from '../entities/generate-text.types';

export interface TextGeneratorPort {
	generate(
		context: InteractionContext<GenerateTextInput>
	): Promise<InteractionResult<GeneratedTextOutput>>;
}
